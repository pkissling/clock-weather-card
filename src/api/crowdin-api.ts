export class CrowdinApi {

  private distributionHash: string

  constructor(distributionHash: string) {
    this.distributionHash = distributionHash
  }

  public fetchManifest = async (): Promise<{ content: Record<string, object> }> => {
    return fetch(`https://distributions.crowdin.net/${this.distributionHash}/manifest.json`)
      .then((response) => response.json())
  }

  public fetchTranslations = async (path: string): Promise<Record<string, object>> => {
    return fetch(`https://distributions.crowdin.net/${this.distributionHash}/${this.sanitizePath(path)}`)
      .then((response) => response.json())
  }

  private sanitizePath = (path: string): string => {
    return path.replace(/^\//, '')
  }

}
