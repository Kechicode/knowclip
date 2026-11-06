import {
  getPreviousWaveformItem,
  PrimaryClip,
  SecondaryClip,
  WaveformItem,
  WaveformRegion,
  WaveformState,
} from 'clipwave'
import { GetWaveformItem } from 'clipwave/dist/useWaveform'
import { overlapsSignificantly } from '../../selectors'

/**
 * The item before the current selection, skipping the current card.
 *
 * A card can span several regions. The region where that card starts would
 * otherwise count as the previous item and only rewind to its beginning.
 */
export function findPreviousSelectableItem(
  regions: WaveformRegion[],
  selection: WaveformState['selection'],
  getItem: GetWaveformItem
) {
  return getPreviousWaveformItem(
    regions,
    selection,
    getItem,
    (item, region, regionIndex, allRegions, getRegionItem) =>
      item.id !== selection.item &&
      isWaveformItemSelectable(
        item,
        region,
        regionIndex,
        allRegions,
        getRegionItem
      )
  )
}

export function isWaveformItemSelectable(
  item: WaveformItem,
  region: WaveformRegion,
  regionIndex: number,
  regions: WaveformRegion[],
  getItem: GetWaveformItem
) {
  if (item.start !== region.start) return false
  if (item.clipwaveType === 'Primary') return true

  const overlappingPrimaryClips = getPrimaryClipsOverlappingSubtitlesCardBase(
    regions,
    getItem,
    regionIndex,
    item
  )

  return !overlappingPrimaryClips.length
}

function getPrimaryClipsOverlappingSubtitlesCardBase(
  regions: WaveformRegion[],
  getItem: GetWaveformItem,
  startRegionIndex: number,
  subtitlesCardBase: SecondaryClip
) {
  const allLocalItemsIds = new Set<string>()

  let regionIndex = startRegionIndex
  while (regions[regionIndex]?.itemIds.includes(subtitlesCardBase.id)) {
    regions[regionIndex].itemIds.forEach((itemId) =>
      allLocalItemsIds.add(itemId)
    )
    regionIndex++
  }
  allLocalItemsIds.delete(subtitlesCardBase.id)

  const overlappingPrimaryClips: PrimaryClip[] = []
  allLocalItemsIds.forEach((id) => {
    const overlapped = getItem(id)
    if (
      overlapped?.clipwaveType === 'Primary' &&
      overlapsSignificantly(
        overlapped,
        subtitlesCardBase.start,
        subtitlesCardBase.end
      )
    )
      overlappingPrimaryClips.push(overlapped)
  })

  return overlappingPrimaryClips
}
