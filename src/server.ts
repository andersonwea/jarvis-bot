const recorder = require('node-record-lpcm16')
import fs from 'fs'

function record(seconds: number) {
  const file = fs.createWriteStream('audio.wav', { encoding: 'binary'})

  const recording = recorder.record()
  recording.stream().pipe(file)
  console.log('Ouvindo...')

  setTimeout(() => {
    recording.stop()
  }, seconds * 1000)
}

record(5)