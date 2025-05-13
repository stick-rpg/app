import { Game } from "../game";
import { prisma } from "../prisma";

function key(room: string, author: string): string {
  return `${room}\n${author}`;
}

// TODO: add timeout session killer

interface StatePlaying {
  type: "playing";
  game: Game;
}

interface StateRegistering {
  type: "registering";
}

interface StateConfirmTakeSession {
  type: "confirmTakeSession";
  previousKey: string;
}

type State = StatePlaying | StateRegistering | StateConfirmTakeSession;

export class App {
  // chat sessions
  activeSessions: Map<string, State>; // sessionKey -> state
  // to enforce a single chat session per user
  activeUsers: Map<string, string>; // userId -> sessionKey

  constructor(
    private readonly sendMessage: (
      room: string,
      author: string,
      content: string
    ) => void
  ) {
    this.activeSessions = new Map();
    this.activeUsers = new Map();
  }

  async message(room: string, author: string, content: string): Promise<void> {
    const state = this.activeSessions.get(key(room, author));
    if (state) {
      switch (state.type) {
        case "playing":
          return await this.handlePlaying(state, room, author, content);
        case "registering":
          return await this.handleRegistering(room, author, content);
        case "confirmTakeSession":
          return await this.handleConfirmTakeSession(
            state,
            room,
            author,
            content
          );
      }
    } else if (content === "/stick") {
      return await this.start(room, author);
    }
  }

  private async handlePlaying(
    state: StatePlaying,
    room: string,
    author: string,
    content: string
  ): Promise<void> {
    if (content === "종료") {
      this.activeSessions.delete(key(room, author));
      this.activeUsers.delete(state.game.userId);
    } else {
      return await state.game.message(content);
    }
  }

  private async handleRegistering(
    room: string,
    author: string,
    content: string
  ): Promise<void> {
    if (content === "가입") {
      const user = await prisma.user.create({
        data: { room, author },
      });
      const game = new Game(
        (message) => this.sendMessage(room, author, message),
        user.id
      );
      const sessionKey = key(room, author);
      this.activeUsers.set(user.id, sessionKey);
      this.activeSessions.set(sessionKey, {
        type: "playing",
        game,
      });
      this.sendMessage(room, author, await game.prompt());
    } else {
      // 가입 안 함
      this.activeSessions.delete(key(room, author));
    }
  }

  private async handleConfirmTakeSession(
    state: StateConfirmTakeSession,
    room: string,
    author: string,
    content: string
  ): Promise<void> {
    if (content === "ㅇㅇ") {
      const previous = this.activeSessions.get(state.previousKey);
      if (previous?.type !== "playing") {
        this.sendMessage(room, author, "오류가 발생했습니다.");
        this.activeSessions.delete(key(room, author));
      } else {
        this.activeSessions.delete(state.previousKey);
        this.activeSessions.set(key(room, author), {
          type: "playing",
          game: previous.game,
        });
        previous.game.setSendMessage((message) =>
          this.sendMessage(room, author, message)
        );
        this.sendMessage(room, author, await previous.game.prompt());
      }
    } else {
      this.activeSessions.delete(key(room, author));
      // take 안 함
    }
  }

  private async start(room: string, author: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { room_author: { room, author } },
    });
    if (user) {
      const sessionKey = this.activeUsers.get(user.id);
      if (sessionKey !== undefined) {
        this.activeSessions.set(key(room, author), {
          type: "confirmTakeSession",
          previousKey: sessionKey,
        });
        this.sendMessage(
          room,
          author,
          "이미 세션이 있습니다. 이어서 하시려면 `ㅇㅇ`를 입력하세요.\n이어서 할 경우 기존 세션은 종료됩니다."
        );
      } else {
        const game = new Game(
          (message) => this.sendMessage(room, author, message),
          user.id
        );
        this.activeUsers.set(user.id, key(room, author));
        this.activeSessions.set(key(room, author), { type: "playing", game });
        this.sendMessage(room, author, await game.prompt());
      }
    } else {
      this.activeSessions.set(key(room, author), { type: "registering" });
      this.sendMessage(
        room,
        author,
        "존재하지 않는 유저입니다.\n가입하시려면 `가입`을 입력하세요."
      );
    }
  }

  dispose(): void {
    for (const state of this.activeSessions.values()) {
      switch (state.type) {
        case "playing":
          state.game.dispose();
          break;
      }
    }
  }
}
