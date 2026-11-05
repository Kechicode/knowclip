import type { Database } from 'better-sqlite3'

/**
 * New cards store their queue position in `due`. Anki shows that as
 * "New #0", "New #1", and so on. Number cards in insertion order and
 * advance the collection's next position so later cards don't collide.
 */
export function assignSequentialNewCardDue(db: Database) {
  const cards = db
    .prepare(`SELECT id FROM cards WHERE type = 0 AND queue >= 0 ORDER BY id`)
    .all() as Array<{ id: number }>

  const updateDue = db.prepare(`UPDATE cards SET due = ? WHERE id = ?`)
  db.transaction((rows: Array<{ id: number }>) => {
    rows.forEach((row, index) => {
      updateDue.run(index, row.id)
    })
  })(cards)

  const col = db.prepare(`SELECT id, conf FROM col LIMIT 1`).get() as
    | { id: number; conf: string }
    | undefined
  if (!col) return

  const conf = JSON.parse(col.conf) as { nextPos?: number }
  conf.nextPos = cards.length
  db.prepare(`UPDATE col SET conf = ? WHERE id = ?`).run(
    JSON.stringify(conf),
    col.id
  )
}
