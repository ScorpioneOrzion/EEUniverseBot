let server;

export const exp = {};
const connection0 = {};

const ConnectionScope = {
  None: 0,
  World: 1,
  Lobby: 2
}

const MessageType = {
  SelfInfo: 23,

  Init: 0,
  Ping: 1,
  Pong: 2,
  Chat: 3,
  ChatOld: 4,
  PlaceBlock: 5,
  PlayerJoin: 6,
  PlayerExit: 7,
  PlayerMove: 8,
  PlayerSmiley: 9,
  PlayerGod: 10,
  CanEdit: 11,
  Meta: 12,
  ChatInfo: 13,
  PlayerAdd: 14,
  ZoneCreate: 15,
  ZoneDelete: 16,
  ZoneEdit: 17,
  ZoneEnter: 18,
  ZoneExit: 19,
  LimitedEdit: 20,
  ChatPMTo: 21,
  ChatPMFrom: 22,
  Clear: 24,
  CanGod: 25,
  BgColor: 26,
  Won: 27,
  Reset: 28,

  RoomConnect: 0,
  RoomDisconnect: 1,
  LoadRooms: 2,
  LoadStats: 3,
}

class Encoder {
  constructor() {
    // this.patterns = {
    //     stringPattern: 0,
    //     intPos: 1,
    //     intNeg: 2,
    //     double: 3,
    //     boolFalse: 4,
    //     boolTrue: 5,
    //     byteArray: 6,
    //     object: 7,
    //     objectEnd: 8
    // }

    // this.types = {
    //     string: 0,
    //     number: 1,
    //     boolean: 2,
    //     byteArray: 3,
    //     object: 4
    // }
  }
  serialize(msg) {
    for (var e, i = 1 + this.count7BitEncodedBytes(msg.type), s = [], o = 0; o !== msg.data.length; o++) {
      i++;
      var type = msg.getType(o);
      var data = msg.get(o);
      if (type === 0)
        i += (e = this.numStringBytes(data)) + this.count7BitEncodedBytes(e),
          s.push(e);
      else if (type === 1)
        e = data,
          i += this.isInteger(e) ? this.count7BitEncodedBytes(e < 0 ? -(e + 1) : e) : 8;
      else if (type === 3)
        i += (e = data.length) + this.count7BitEncodedBytes(e);
      else if (type == 4) {
        for (var h in data) {
          i += (e = this.numStringBytes(h)) + this.count7BitEncodedBytes(e),
            s.push(e),
            i++;
          var u = data[h];
          "string" == typeof u ? (i += (e = this.numStringBytes(u)) + this.count7BitEncodedBytes(e),
            s.push(e)) : "number" == typeof u ? i += this.isInteger(u) ? this.count7BitEncodedBytes(u) : 8 : u instanceof Array && (i += u.length + this.count7BitEncodedBytes(u.length))
        }
        i++
      }
    }
    var c = Buffer.from(new ArrayBuffer(i));
    this.index = 0,
      c.writeUInt8(msg.scope, this.index++),
      this.write7BitEncodedInt(c, msg.type);
    for (var d = 0, f = 0; f !== msg.data.length; f++) {
      var type = msg.getType(f);
      var data = msg.get(f);
      if (type === 0)
        this.write(c, type, data, s[d++]);
      else if (type == 4) {
        c.writeUInt8(7, this.index++);
        for (var v in data) {
          var m = data[v];
          "string" == typeof m ? this.write(c, 0, m, s[d++]) : "number" == typeof m ? this.write(c, 1, m) : "boolean" == typeof m ? this.write(c, 2, m) : m instanceof Array && this.write(c, 3, m),
            e = s[d++],
            this.write7BitEncodedInt(c, e),
            c.write(v, this.index),
            this.index += e
        }
        c.writeUInt8(8, this.index++)
      } else
        this.write(c, type, data)
    }

    return Buffer.from(c);
  }

  deserialize(t) {
    var e;
    this.index = 0;
    for (var i, r = t.readUInt8(this.index++); this.index < t.length;) {
      var s = 1 == this.index ? 1 : t.readUInt8(this.index++);
      if (s === 1) {
        var o = this.read7BitEncodedInt(t);
        e ? e.add(o) : (e = new Message(0, o)).scope = r
      } else if (e)
        if (s === 0) {
          i = this.read7BitEncodedInt(t);
          var a = t.toString("utf8", this.index, this.index + i);
          this.index += i,
            e.add(a)
        } else if (s === 2)
          e.add(-this.read7BitEncodedInt(t) - 1);
        else if (s === 3)
          e.add(t.readDoubleLE(this.index)),
            this.index += 8;
        else if (s === 4)
          e.add(false);
        else if (s === 5)
          e.add(true);
        else if (s === 6) {
          i = this.read7BitEncodedInt(t);
          for (var h = new Array(i), u = 0; u !== i; u++)
            h[u] = t.readUInt8(this.index++);
          e.add(h)
        } else if (s === 7) {
          for (var c = {}; t.readUInt8(this.index) != 8;) {
            var d = t.readUInt8(this.index++)
              , f = void 0;
            if (d === 0)
              i = this.read7BitEncodedInt(t),
                f = t.toString("utf8", this.index, this.index + i),
                this.index += i;
            else if (d === 1)
              f = this.read7BitEncodedInt(t);
            else if (d === 2)
              f = -this.read7BitEncodedInt(t) - 1;
            else if (d === 3)
              f = t.readDoubleLE(this.index),
                this.index += 8;
            else if (d === 4)
              f = !1;
            else if (d === 5)
              f = !0;
            else if (d === 6) {
              i = this.read7BitEncodedInt(t);
              for (var p = new Array(i), g = 0; g !== i; g++)
                p[g] = t.readUInt8(this.index++);
              f = p
            }
            i = this.read7BitEncodedInt(t);
            var v = t.toString("utf8", this.index, this.index + i);
            this.index += i,
              void 0 !== f && (c[v] = f)
          }
          this.index++,
            e.add(c)
        }
    }
    if (!e)
      throw new Error("Invalid message");

    return e
  }


  write(t, e, i) {
    var r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 0;
    if (e == 0)
      t.writeUInt8(0, this.index++),
        this.write7BitEncodedInt(t, r),
        t.write(i, this.index),
        this.index += r;
    else if (e == 1)
      this.isInteger(i) ? (t.writeUInt8(i < 0 ? 2 : 1, this.index++),
        this.write7BitEncodedInt(t, i < 0 ? -(i + 1) : i)) : (t.writeUInt8(3, this.index++),
          t.writeDoubleLE(i, this.index),
          this.index += 8);
    else if (e == 2)
      t.writeUInt8(i ? 5 : 4, this.index++);
    else if (e == 3) {
      t.writeUInt8(6, this.index++),
        this.write7BitEncodedInt(t, i.length);
      var s = !0
        , o = !1
        , a = void 0;
      try {
        for (var l, h = i[Symbol.iterator](); !(s = (l = h.next()).done); s = !0) {
          var u = l.value;
          t.writeUInt8(u, this.index++)
        }
      } catch (t) {
        o = !0,
          a = t
      } finally {
        try {
          s || null == h.return || h.return()
        } finally {
          if (o)
            throw a
        }
      }
    }
  }
  numStringBytes(t) {
    for (var e = 0, i = 0; i < t.length; i++) {
      var n = t.charCodeAt(i);
      n <= 127 ? e += 1 : n <= 2047 ? e += 2 : n >= 55296 && n <= 57343 ? (e += 4,
        i++) : e += n < 65535 ? 3 : 4
    }
    return e
  }
  read7BitEncodedInt(t) {
    var e, i = 0, n = 0;
    do {
      if (35 == n)
        throw new Error("Invalid format.");
      e = t.readUInt8(this.index),
        this.index++,
        i |= (127 & e) << n,
        n += 7
    } while (0 != (128 & e)); return i
  }
  write7BitEncodedInt(t, e) {
    for (var i = e; i >= 128;)
      t.writeUInt8(i % 256 | 128, this.index++),
        i >>>= 7;
    t.writeUInt8(i, this.index++)
  }
  count7BitEncodedBytes(num) {
    return (num = num < 0 ? -(num + 1) : num) < 128 ? 1 : num < 16384 ? 2 : num < 2097152 ? 3 : num < 268435456 ? 4 : 5;
  }
  isInteger(num) {
    return num % 1 == 0 && num >= -2147483648 && num <= 2147483647;
  }
}

class Message {
  constructor(scope, type) {
    this.scope = scope;
    this.type = type;
    this.data = [];
    for (let i = 2; i < arguments.length; i++) {
      this.data[i - 2] = arguments[i];
    }
  }

  get(index) {
    return this.data[index];
  }
  getType(index) {
    return typeof (this.get(index)) === "string" ? 0 :
      typeof (this.get(index)) === "number" ? 1 :
        typeof (this.get(index)) === "boolean" ? 2 :
          isByteArray(this.get(index)) ? 3 : 4;
  }
  add(obj) {
    this.data.push(obj);
  }
  settype(type) {
    this.type = type;
  }
}

const en = new Encoder();
let isConnected = false;

function isByteArray(array) {
  if (array && array.byteLength !== undefined) return true;
  return false;
}

function send(messageType) {
  const data = [];
  for (let i = 1; i < arguments.length; i++) {
    data[i - 1] = arguments[i];
  }
  const m = new Message(ConnectionScope.World, messageType, ...data);

  server.send(en.serialize(m));
}

function sendLobby(messageType) {
  const data = [];
  for (let i = 1; i < arguments.length; i++) {
    data[i - 1] = arguments[i];
  }
  const m = new Message(ConnectionScope.Lobby, messageType, ...data);
  server.send(en.serialize(m));
}

function onMessage(func) {
  console.log(server)
  server.onmessage = function (message) {
    const m = en.deserialize(Buffer.from(message));
    func(m);
  };
}

async function disconnect() {
  await server.close();
}

function connect(auth) {
  return new Promise(function (resolve, reject) {
    server = new WebSocket("wss://game.ee-universe.com/?a=" + auth);
    server.onopen = function () {
      connection0.send = send;
      connection0.sendLobby = sendLobby;
      connection0.joinRoom = joinRoom;
      connection0.onMessage = onMessage;
      connection0.disconnect = disconnect;
      resolve(connection0);
    };
    server.onerror = function (err) {
      reject(err);
    };
  });
}

function joinRoom(roomId) {
  const m = new Message(ConnectionScope.Lobby, MessageType.RoomConnect, "world", roomId);
  server.send(en.serialize(m));
}

exp.ConnectionScope = ConnectionScope;
exp.MessageType = MessageType;
exp.Message = Message;
exp.connect = connect;
exp.getFgId = (id) => {
  return id & 0xFFFF;
}
exp.getBgId = (id) => {
  return id >> 16;
}