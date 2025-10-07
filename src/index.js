import l10n from './l10n/index.js';
;(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error('Sandboxed mode is not supported')
  }
  const translate = function (key) {
    const locale = globalThis.navigator.language.slice(0, 2);
    if (l10n[locale] && l10n[locale][key]) {
      return l10n[locale][key]
    } else {
      return l10n['en'][key] || key
    }
  }
  class ScbackendSDK {
    constructor() {
      this.ws = null;
      this.isopened = false;
      this.delay = -1;
    }

    getInfo() {
      return {
        id: 'scbackendsdk',
        name: "Scbackend SDK",
        blocks: [
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'connect',
            text: translate('scbackendsdk.connect'),
            arguments: {
              remaddr: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'ws://localhost:3031'
              },
              instname: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'test'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'connectwait',
            text: translate('scbackendsdk.connectwait'),
            arguments: {
              remaddr: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'ws://localhost:3031'
              },
              instname: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'test'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'disconnect',
            text: translate('scbackendsdk.disconnect'),
          },
          {
            blockType: Scratch.BlockType.BOOLEAN,
            opcode: 'isconnected',
            text: translate('scbackendsdk.isconnected'),
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'ping',
            text: translate('scbackendsdk.ping'),
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'send',
            text: translate('scbackendsdk.send'),
            arguments: {
              msg: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello, world!'
              }
            }
          },
          {
            blockType: Scratch.BlockType.EVENT,
            opcode: 'whenmessage',
            text: translate('scbackendsdk.whenmessage'),
            isEdgeActivated: false
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'getmsg',
            text: translate('scbackendsdk.getmsg'),
          }
        ],
      }
    }

    _doconnect(remaddr, dst, util, resolve, reject) {
      let attempts = 0;
      const maxAttempts = 5;
      const connectWS = () => {
        this.ws = new WebSocket(remaddr);
        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({ type: 'handshake', dst: dst.toString() }));
        };
        this.ws.onmessage = (event) => {
          const msg = event.data;
          const data = JSON.parse(msg);
          switch (data.type) {
          case 'handshake':
            if (data.status === 'ok') {
              this.isopened = true;
              this.sessionid = data.sessionId;
              if (resolve) resolve();
            } else {
              this.ws.close();
              this.ws = null;
              this.isopened = false;
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(connectWS, 1000);
              } else {
                util.startHats('scbackendsdk_whenerror');
                if (reject) reject(new Error('Handshake failed'));
              }
            }
            break;
          case 'message':
            util.startHats('scbackendsdk_whenmessage').forEach(t => {
              t.initParams();
              t.pushParam('data', data.message);
            });
            break;
          case 'pong':
            this.delay = Date.now() - this.dtimer;
            break;
          }
        };
        this.ws.onclose = (event) => {
          let isopened = this.isopened;
          this.ws = null;
          this.isopened = false;
          if (isopened) return;
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(connectWS, 1000);
          } else {
            util.startHats('scbackendsdk_whenerror');
            if (reject) reject(event);
          }
        };
        this.ws.onerror = (error) => {
          attempts++;
          if (attempts < maxAttempts) {
          setTimeout(connectWS, 1000);
          } else {
          util.startHats('scbackendsdk_whenerror');
          if (reject) reject(error);
          }
        };
      };
      connectWS();
    }

    connect(args, util) {
      if(this.ws) {
        this.ws.close();
        this.ws = null;
        this.isopened = false;
      }
      this._doconnect(args.remaddr, args.instname, util);
    }

    connectwait(args, util) {
      return new Promise((resolve, reject) => {
        this._doconnect(args.remaddr, args.instname, util, resolve, reject);
      });
    }

    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.isopened = false;
      }
    }

    isconnected() {
      return this.isopened;
    }

    ping() {
      if (this.ws && this.isopened) {
        this.dtimer = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
      return this.delay;
    }

    send(args) {
      if (this.ws && this.isopened) {
        this.ws.send(JSON.stringify({ type: 'message', body: args.msg }));
      }
    }

    getmsg(_args, util) {
      return util.thread.getParam('data') || '';
    }
  }
  Scratch.extensions.register(new ScbackendSDK())
})(Scratch)
