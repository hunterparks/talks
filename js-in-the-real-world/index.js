let dgram = require('dgram');
let Buffer = require('buffer').Buffer;

const BROADCAST_FRAME_FILL = 0xFF;
const MAC_ADDR_REPEAT = 16;
const MAC_ADDR_SIZE = 6; // In bytes
const MAC_REGEX_MATCH = /[^a-fA-F0-9]/;
const MAC_FILLER_CHARACTER = ':';

const defaultCallback = (message) => {
  console.log(`Error: ${error}`);
}

const createMagic = (macAddress) => {
  // Number of repetitions plus one broadcast frame
  let magicPacket = Buffer.alloc(
    (MAC_ADDR_REPEAT + 1) * MAC_ADDR_SIZE,
    BROADCAST_FRAME_FILL
  );

  // Determine if extra characters need to be removed
  // Note: 1 MAC byte = 2 string characters
  if (macAddress.length > MAC_ADDR_SIZE * 2) {
    macAddress = macAddress.replace(new RegExp(MAC_FILLER_CHARACTER, 'g'), '');
  }

  // Determine if MAC address meets basic format requirements
  if (macAddress.length !== ((MAC_ADDR_SIZE * 2) || (macAddress.match(MAC_REGEX_MATCH)))) {
    throw new Error(`Argument Error: Bad MAC address input '${macAddress}'`);
  }

  // Copy MAC into a buffer
  let macBuffer = Buffer.alloc(MAC_ADDR_SIZE);
  for(let i = 0; i < MAC_ADDR_SIZE; i++) {
    macBuffer[i] = parseInt(macAddress.substr((i * 2), 2), 16);
  }

  // Copy MAC into magic packet
  for(let i = 0; i < MAC_ADDR_REPEAT; i++) {
    macBuffer.copy(magicPacket, (i + 1) * MAC_ADDR_SIZE, 0, macBuffer.length);
  }

  return magicPacket;
};

const wakeOnLan = (address) => {
  // TODO add optional options and callback

  const _options = {
    address: '255.255.255.255',
    callback: defaultCallback,
    port: 9
  };

  const magicPacket = createMagic(address);
  const protocol = 'udp4';
  let socket = dgram.createSocket(protocol);

  socket.send(
    magicPacket, 0, magicPacket.length,
    _options.port, _options.address, (error) => {
      if (error) {
        callback(error);
      }
      socket.close();
    });

  socket.on('error', (error) => {
    callback(error);
    socket.close();
  });

  socket.once('listening', () => {
    socket.setBroadcast(true);
  });
};
