import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material'
import moment from 'moment'
import { actions } from '../../actions'
import { DialogProps } from './DialogProps'
import { formatDurationWithMilliseconds } from '../../utils/formatTime'
import { uuid } from '../../mockable/sideEffects'
import { splitClipDialog$ as $ } from './SplitClipDialog.testLabels'

const formatRange = (startMs: number, endMs: number) =>
  `${formatDurationWithMilliseconds(
    moment.duration(startMs)
  )} – ${formatDurationWithMilliseconds(moment.duration(endMs))}`

const SplitClipDialog = ({
  open,
  data,
}: DialogProps<SplitClipDialogData>) => {
  const dispatch = useDispatch()
  const [leftTranscription, setLeftTranscription] = useState(
    data.originalTranscription
  )
  const [rightTranscription, setRightTranscription] = useState('')

  const cancel = useCallback(() => {
    dispatch(actions.closeDialog())
  }, [dispatch])

  const save = useCallback(() => {
    dispatch(actions.closeDialog())
    dispatch(
      actions.splitClip({
        clipId: data.clipId,
        newClipId: uuid(),
        splitAt: data.splitAt,
        leftTranscription,
        rightTranscription,
      })
    )
  }, [data.clipId, data.splitAt, dispatch, leftTranscription, rightTranscription])

  return (
    <Dialog open={open} onClose={cancel} className={$.container} fullWidth>
      <DialogTitle>Split card</DialogTitle>
      <DialogContent>
        <TextField
          id={$.leftField}
          label={formatRange(data.start, data.splitAt)}
          value={leftTranscription}
          onChange={(event) => setLeftTranscription(event.target.value)}
          multiline
          minRows={3}
          fullWidth
          margin="normal"
          autoFocus
        />
        <TextField
          id={$.rightField}
          label={formatRange(data.splitAt, data.end)}
          value={rightTranscription}
          onChange={(event) => setRightTranscription(event.target.value)}
          multiline
          minRows={3}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel} id={$.cancelButton}>
          Cancel
        </Button>
        <Button onClick={save} id={$.saveButton} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SplitClipDialog
