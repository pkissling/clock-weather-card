declare global {
  interface Window {
    customCards: CustomCard[]
  }

  interface CustomCard {
    type: string
    name: string
    description?: string
    preview?: boolean
    documentationURL?: string
  }
}

export {}
