import { WebSocket, WebSocketServer } from "ws";
import { App } from "./app";

export interface RequestMessage {
  type: "message";
  content: string;
  room: string;
  author: string;
}

export type Request = RequestMessage;

export interface ResponseMessage {
  type: "message";
  content: string;
  room: string;
  author: string;
}

export type Response = ResponseMessage;

const port = parseInt(process.env.PORT || "8080") || 8080;

const server: WebSocketServer = new WebSocketServer({ port });
server.on("connection", (ws: WebSocket) => {
  const app = new App((room, author, content) => {
    ws.send(JSON.stringify({ type: "message", content, room, author }));
  });

  ws.on("message", async (data: string) => {
    try {
      const request: RequestMessage = JSON.parse(data);
      app.message(request.room, request.author, request.content);
    } catch (error) {
      console.error(error);
    }
  });

  ws.on("close", () => {
    app.dispose();
  });
});
