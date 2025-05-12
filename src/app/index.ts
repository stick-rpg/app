export class App {
  constructor(
    private readonly out: (
      room: string,
      author: string,
      content: string
    ) => void
  ) {
    console.log("App constructor");
  }

  message(room: string, author: string, content: string): void {
    console.log({ room, author, content });

    if (content === "ping") {
      this.out(room, author, "pong");
    }
  }

  dispose(): void {
    //
  }
}
