import logger from '@/service/logger'

// The bundle can be evaluated twice (e.g. a resource registered under two URLs), and a repeated define throws.
export const customElement = (name: string) => (cls: CustomElementConstructor): void => {
  if (!customElements.get(name)) customElements.define(name, cls)
  else logger.warn('The card is loaded more than once, check your dashboard resources for duplicate entries')
}
