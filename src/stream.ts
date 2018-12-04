import { Topic, Hash, Data, Listener, Subscriber, Subscribers } from './types'

class Stream {
  private subscribers: Subscribers = {}
  private listeners: Listener[] = []
  public topic: string

  constructor(topic: Topic) {
    this.topic = topic
  }

  emit(hash: Hash, data: Data) {
    for (const listener of this.listeners) {
      listener(hash, data)
    }
    if (this.subscribers[hash]) {
      const subscriber = this.subscribers[hash]
      subscriber(data)
    }
  }

  subscribe(hash: Hash, subscriber: Subscriber) {
    this.subscribers[hash] = subscriber
  }

  unsubscribe(hash: Hash) {
    delete this.subscribers[hash]
  }

  listen(listener: Listener) {
    this.listeners.push(listener)
  }
}

export default Stream
