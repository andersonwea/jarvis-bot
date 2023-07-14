import 'dotenv/config'
import recorder from 'node-record-lpcm16'
import fs, { readFileSync } from 'fs'
import wavefile from 'wavefile';

import { HfInference } from '@huggingface/inference'



function recordAudio() {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream('src/data/audio.wav')
  
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

async function transcribeAudioHuggingApi() {
  const hf = new HfInference(process.env.HF_API_KEY)

  const start = performance.now()
  const transcription = await hf.automaticSpeechRecognition({
    model: 'jonatasgrosman/wav2vec2-large-xlsr-53-portuguese',
    data: readFileSync('src/data/audio.wav'),
  })
  const end = performance.now()

  const requestTime = (end - start) / 1000

  return {transcription, requestTime}
}


async function main() {
  await recordAudio()
  const { transcription, requestTime } = await transcribeAudioHuggingApi()

  console.log(`Executou em: ${requestTime} segundos`)
  console.log(transcription.text)
}

main()