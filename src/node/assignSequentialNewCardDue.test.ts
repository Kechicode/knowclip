import sql from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { assignSequentialNewCardDue } from './assignSequentialNewCardDue'

function createDb() {
  const db = sql(':memory:')
  db.exec(`
    CREATE TABLE col (
      id integer primary key,
      conf text not null
    );
    CREATE TABLE cards (
      id integer primary key,
      type integer not null,
      queue integer not null,
      due integer not null
    );
  `)
  db.prepare(`INSERT INTO col (conf) VALUES (?)`).run(
    JSON.stringify({ nextPos: 1 })
  )
  return db
}

describe('assignSequentialNewCardDue', () => {
  it('numbers new cards in insertion order starting at 0', () => {
    const db = createDb()
    const insert = db.prepare(
      `INSERT INTO cards (type, queue, due) VALUES (0, 0, 0)`
    )
    insert.run()
    insert.run()
    insert.run()

    assignSequentialNewCardDue(db)

    expect(
      db.prepare(`SELECT due FROM cards ORDER BY id`).all()
    ).toEqual([{ due: 0 }, { due: 1 }, { due: 2 }])
    expect(
      JSON.parse(
        (db.prepare(`SELECT conf FROM col`).get() as { conf: string }).conf
      ).nextPos
    ).toBe(3)
  })

  it('leaves suspended cards out of the new-card sequence', () => {
    const db = createDb()
    db.prepare(
      `INSERT INTO cards (type, queue, due) VALUES (0, 0, 0), (0, -1, 0), (0, 0, 0)`
    ).run()

    assignSequentialNewCardDue(db)

    expect(
      db.prepare(`SELECT queue, due FROM cards ORDER BY id`).all()
    ).toEqual([
      { queue: 0, due: 0 },
      { queue: -1, due: 0 },
      { queue: 0, due: 1 },
    ])
  })
})
