export class CameraService {
  static async checkPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  }

  static async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput')
  }

  static applyUVFilter(imageData: ImageData): ImageData {
    const data = imageData.data
    
    // Simulate UV filter by enhancing blues and reducing reds/greens
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i] * 0.3       // Red channel
      data[i + 1] = data[i + 1] * 0.4 // Green channel
      data[i + 2] = Math.min(255, data[i + 2] * 1.8) // Blue channel
      
      // Add slight purple tint
      data[i] += 30
      data[i + 2] += 50
    }
    
    return imageData
  }

  static detectGlare(imageData: ImageData): boolean {
    const data = imageData.data
    let brightPixels = 0
    const threshold = 240
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness > threshold) {
        brightPixels++
      }
    }
    
    const glarePercentage = (brightPixels / (data.length / 4)) * 100
    return glarePercentage > 15 // More than 15% bright pixels indicates glare
  }

  static async captureFrame(video: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')
    
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.95)
  }
}