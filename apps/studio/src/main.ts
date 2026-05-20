import { BeautyEngine } from "@bae-ar/engine"

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()

  console.log(engine.getState())

  await engine.initialize()

  console.log(engine.getState())

  await engine.start()

  console.log(engine.getState())
}

bootstrap()
