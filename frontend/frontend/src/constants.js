export const INSTRUCTIONS = {
  embed: {
    lsb: {
      sequential: {
        title: "Sequential LSB",
        steps: [
          "Select an image you wish to hide your message in",
          "Enter your secret message",
          "Your secret message is hidden in side the image in a sequential manner, starting from the first pixel. This method is simpler but may be more vulnerable to detection"
        ]
      },
      random: {
        title: "Random LSB",
        steps: [
          "Select an image you wish to hide your message in",
          "Enter a secret Key",
          "Enter your secret message",
          "Your secret message is hidden in side the image in a random manner, determined by the secret key. This method is more secure against detection but requires the same key for extraction"
        ]
      }
    },
    dct: {
      title: "DCT Frequency Embedding",
      steps: [
        "Select an image you wish to hide your message in",
        "Enter your secret message",
        "Your secret message is hidden inside the image by modifying the frequency coefficients of the image rather than its pixels directly. This method is more robust against detection and compression but is more complex than LSB."
      ]
    }
  },
  extract: {
    lsb: {
      sequential: {
        title: "Sequential LSB",
        steps: [
          "Select an image containing a secret message",
          "The tool will extract the hidden message from the image, revealing the secret information stored inside"
        ]
      },
      random: {
        title: "Random LSB",
        steps: [
          "Select an image containing a secret message",
          "Enter the same secret key used during embedding",
          "The tool will use the key to determine the random pattern and extract the hidden message from the image, revealing the secret information stored inside"
        ]
      }
    },
    dct: {
      title: "DCT Frequency Extraction",
      steps: [
        "Select an image you wish to extract your message from",
        "Your secret message is extracted from the image by analysing the modified frequency coefficients"
      ]
    }
  }
}
