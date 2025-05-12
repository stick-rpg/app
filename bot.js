// This script is for MessengerBotR app.

// =============================================================================

const session = {};

// =============================================================================

const WEBSOCKET_URL = "ws://localhost:8080/";
const RECONNECT_DELAY = 5000; // 5 seconds

let webSocketConnection = null;
let reconnectTimeout = null;

const OkHttpClient = Packages.okhttp3.OkHttpClient;
const Request = Packages.okhttp3.Request;
const WebSocketListener = Packages.okhttp3.WebSocketListener;
const Response = Packages.okhttp3.Response;
const ByteString = Packages.okio.ByteString;

function connectWebSocket() {
  try {
    const client = new OkHttpClient.Builder().build();
    const request = new Request.Builder().url(WEBSOCKET_URL).build();
    client.newWebSocket(request, MyWebSocketListener);
  } catch (e) {
    Log.e("WebSocket 연결 시도 중 오류: " + e);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = setTimeout(() => {
    Log.i("WebSocket 재연결 시도...");
    connectWebSocket();
  }, RECONNECT_DELAY);
}

const MyWebSocketListener = new WebSocketListener({
  onOpen: function (webSocket, response) {
    Log.i("WebSocket 연결됨");
    webSocketConnection = webSocket;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  },

  onMessage: function (webSocket, text) {
    const msg = JSON.parse(text);
    if (msg.type === "message") {
      const room = msg.room;
      const author = msg.author;
      const content = msg.content;
      if (session[room] && session[room][author]) {
        session[room][author](content);
      } else {
        Log.e("세션 없음: " + room + " - " + author);
      }
    }
  },

  onFailure: function (webSocket, t, response) {
    Log.e("WebSocket 오류 발생: " + t.getMessage());
    webSocketConnection = null;
    scheduleReconnect();
  },

  onClosing: function (webSocket, code, reason) {
    Log.i("WebSocket 연결 종료 중: " + code + " - " + reason);
  },

  onClosed: function (webSocket, code, reason) {
    Log.i("WebSocket 연결 종료됨: " + code + " - " + reason);
    webSocketConnection = null;
    scheduleReconnect();
  }
});

// Initial connection
connectWebSocket();

/**
 * @param {string} message
 */
function sendWebSocketMessage(message) {
  if (webSocketConnection) {
    try {
      const success = webSocketConnection.send(message);
      if (!success) {
        Log.e("WebSocket 메시지 전송 실패 (큐 꽉 참 등)");
        webSocketConnection.close(1000, "Message queue full");
        webSocketConnection = null;
        scheduleReconnect();
      }
    } catch (e) {
      Log.e("WebSocket 메시지 전송 중 오류: " + e);
      webSocketConnection.close(1000, "Error sending message");
      webSocketConnection = null;
      scheduleReconnect();
    }
  } else {
    Log.e("WebSocket이 연결되어 있지 않아 메시지를 전송할 수 없습니다.");
    connectWebSocket();
  }
}

const bot = BotManager.getCurrentBot();

// =============================================================================

function onMessage(msg) {
  const content = msg.content;
  const room = msg.room;
  const author = msg.author.name;

  session[room] = session[room] || {};
  session[room][author] = (content) => msg.reply(content);

  sendWebSocketMessage(
    JSON.stringify({
      type: "message",
      room: room,
      author: author,
      content: content
    })
  );
}

bot.addListener(Event.MESSAGE, onMessage);

// TODO: disconnect on failure, reconnect on message
