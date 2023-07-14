import 'dotenv/config'
import recorder from 'node-record-lpcm16'
import fs, { readFileSync } from 'fs'
import wavefile from 'wavefile';

import { pipeline } from '@xenova/transformers'
import { Configuration, OpenAIApi } from "openai"


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
  const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base')

  const readStream = fs.createReadStream('src/data/audio.wav')
  const buffers = []
  
  for await (const data of readStream) {
    buffers.push(data)
  }

  const buffer = Buffer.concat(buffers)
    
  const wav = new wavefile.WaveFile(buffer)
  wav.toBitDepth('32f')
  wav.toSampleRate(16000) 
  let audioData = wav.getSamples()

  if (Array.isArray(audioData)) {
    audioData = audioData[0]
  }

  const transcription = await transcriber(audioData)

  return transcription.text
}

async function textGeneration(question: string) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const openai = new OpenAIApi(configuration)

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{
      "role": "system", "content": "Você é um assitente direto ao ponto, use respostas curtas"
    },
     {role: "user", content: question}],
     max_tokens: 100
  });

  const inputPriceToken = 0.002 / 1000
  const outputPriceToken = 0.0015 / 1000

  const tokensUsed = completion.data.usage
  
  const completionTokens = tokensUsed?.completion_tokens ?? 0
  const promptTokens = tokensUsed?.prompt_tokens ?? 0

  const usage = (completionTokens * outputPriceToken) + (promptTokens * inputPriceToken)

  const output = completion.data.choices[0].message

  return {output, usage}
}


async function main() {
  await recordAudio()

  const start = performance.now()
  const transcription = await transcribeAudioHuggingApi()

  console.log(`Usuário: ${transcription}`)
  const { output, usage } = await textGeneration(transcription)
  const price = new Intl.NumberFormat('USD', {
    style: 'currency',
    maximumFractionDigits: 5,
    currency: 'USD',
  }).format((usage))

  const end = performance.now()

  const requestTime = (end - start) / 1000

  console.log(`Executou em: ${requestTime} segundos`)
  console.log(`Essa pergunta custou: ${price}`)
  console.log(output)
}

main()