export class Game {
  private lastActive: Date;

  constructor(
    private sendMessage: (content: string) => void,
    private readonly userId: string
  ) {
    this.lastActive = new Date();
  }

  setSendMessage(sendMessage: (content: string) => void): void {
    this.sendMessage = sendMessage;
  }

  async prompt(): Promise<string> {
    this.lastActive = new Date();
    return "Hello world!\n\nEnter `ping` to get a response.";
  }

  async message(content: string): Promise<void> {
    this.lastActive = new Date();
    if (content === "ping") {
      this.sendMessage("pong");
    }
  }

  dispose(): void {
    //
  }
}
