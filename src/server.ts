const recorder = require('node-record-lpcm16')
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import 'dotenv/config'

function recordAudio(filename: string) {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(filename)
  
    const recording = recorder.record()
    recording.stream().pipe(file)
      .on('error', (err: string) => {
        reject(err)
    })

    console.log('Ouvindo... aperte Ctrl+C para parar')
  
    process.on('SIGINT', () => {
      recording.stop()
      console.log('Escutei')
      resolve()
    })
  })
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


async function main() {
  await recordAudio('audio.wav')
}

main()