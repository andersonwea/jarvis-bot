const recorder = require('node-record-lpcm16')
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import 'dotenv/config'

function record(seconds: number) {
  const file = fs.createWriteStream('audio.wav', { encoding: 'binary'})

  const recording = recorder.record()
  recording.stream().pipe(file)
  console.log('Ouvindo...')

  setTimeout(() => {
    recording.stop()
  }, seconds * 1000)
}


async function transcribeAudio(filename: string) {
  const readStream = fs.createReadStream(filename)

  const formData = new FormData()
  formData.append('file', readStream, 'audio.wav')
  formData.append('model', 'whisper-1')

  const transcript = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    }
  })
  const text = transcript.data.text
  console.log(text)




}

transcribeAudio('audio.wav')