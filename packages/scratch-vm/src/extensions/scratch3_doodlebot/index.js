require("regenerator-runtime/runtime"); // required to use async/await
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const Color = require('../../util/color');

const Doodlebot = require('./doodlebot-web-bluetooth/index.js');

// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,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';

const EXTENSION_ID = 'doodlebot';

const _colors = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'random'];
// blue 255 green 65280 red 16711680 


const _drive = ['forward', 'backward', 'left', 'right'];
const _drive_protocol = ['0,0', '1,1', '0,1', '1,0'];

const _pen_dirs = ['up', 'down'];
const _pen_protocol = ['0', '45'];

const _faces = ['angry', 'happy', 'confused', 'worried', 'annoyed', 'sleeping', 'fear', 'disgust', 'engaged', 'love', 'sad', 'wrong', 'surprise', 'blink', 'neutral'];
const _face_protocol = ['a', 'h', 'm', 'r', 'y', 'l', 'f', 'd', 'e', 'o', 's', 'w', 'p', 'b', 'n'];

const _sensors = ['bumpers','distance','altimeter','accelerometer','magenetometer','gyroscope','color sensor','temperature','humidity','pressure'];
const _sensor_protocol = ['b', 'd', 'u', 'x', 'o', 'g', 'l', 't', 'h', 'p'];


// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class DoodlebotBlocks {    
    constructor (runtime) {
        /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.scratch_vm = runtime;
        this.scratch_vm.registerPeripheralExtension(EXTENSION_ID, this);
        this.scratch_vm.connectPeripheral(EXTENSION_ID, 0);
        
        this.robot = this;
        
        this._robotStatus = 1;
        this._robotDevice = null;
        this._robotUart = null;

        this.scratch_vm.on('PROJECT_STOP_ALL', this.resetRobot.bind(this));
        this.scratch_vm.on('CONNECT_DOODLEBOT', this.connectToBLE.bind(this));
        
        console.log("Version: initial commands for new doodlebot");
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: formatMessage({
                id: 'doodlebot',
                default: 'PRG Doodlebot Blocks',
                description: 'Extension using BLE to communicate with Doodlebot'
            }),
            showStatusButton: true,
            blockIconURI: blockIconURI,
            menuIconURI: blockIconURI,

            blocks: [
                {
                    func: 'CONNECT_DOODLEBOT',
                    blockType: BlockType.BUTTON,
                    text: 'Connect Robot'
                },
                '---',
                {
                    opcode: 'displayFace',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.displayFace',
                        default: 'display [FACE] face',
                        description: 'Set the face display'
                    }),
                    arguments: {
                        FACE: {
                            type:ArgumentType.STRING,
                            menu: 'FACES',
                            defaultValue: "neutral"
                        }    
                    }
                },
                {
                    opcode: 'clearDisplay',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.clearDisplay',
                        default: 'clear display',
                        description: 'Clear the display'
                    }),
                    arguments: {}
                },
                '---',
                {
                    opcode: 'setPixelColor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.setLEDColor',
                        default: 'set pixels to [COLOR]',
                        description: 'Set the neopixel color'
                    }),
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'pixelsOff',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.ledOff',
                        default: 'turn off pixels',
                        description: 'Turn off the LED'
                    }),
                    arguments: { }
                },
                '---',
                {
                    opcode: 'drive',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.driveFor',
                        default: 'drive [DIR] for [NUM] steps',
                        description: 'Send command to robot to move motors for a certain number of steps'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 50
                        },
                        DIR: {
                            type:ArgumentType.String,
                            menu: 'DIRS',
                            defaultValue: _drive[0]
                        }
                    }
                },
                {
                    opcode: 'stopMotors',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.stopMotors',
                        default: 'stop motors',
                        description: 'Send command to robot to stop moving motors'
                    }),
                    arguments: {}
                },
                {
                    opcode: 'movePen',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.movePen',
                        default: 'move pen [DIR]',
                        description: 'Send command to robot to raise or lower pen'
                    }),
                    arguments: {
                        DIR: {
                            type:ArgumentType.String,
                            menu: 'PEN_DIRS',
                            defaultValue: _pen_dirs[0]
                        }
                    }
                },
                '---',
                {
                    opcode: 'sendCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'doodlebot.sendCommand',
                        default: 'send comand [COMMAND]',
                        description: 'Send a particular command to the robot'
                    }),
                    arguments: {
                        COMMAND: {
                            type:ArgumentType.STRING,
                            defaultValue: "(d,n)"
                        }
                    }
                },
            ],
            menus: {
                FACES: {
                    acceptReporters: false,
                    items: _faces
                },
                DIRS: {
                    acceptReporters: false,
                    items: _drive
                },
                PEN_DIRS: {
                    acceptReporters: false,
                    items: _pen_dirs
                }
            }
        };
    }
    
    /* The following 4 functions have to exist for the peripherial indicator */
    connect() {
    }
    disconnect() {
    }
    scan() {
        
    }
    isConnected() {
        console.log("isConnected status: " + this._robotStatus);
        return (this._robotStatus == 2);
    }
    
    onDeviceConnected() {
        console.log("Connected to bluetooth device: ", this._robotDevice);

        // update peripheral indicator
        this._robotStatus = 2;
        this.scratch_vm.emit(this.scratch_vm.constructor.PERIPHERAL_CONNECTED);

        // set listener for device disconnected
        console.log("Listen for device disconnect")
        this._robotDevice.addEventListener("gattserverdisconnected", this.onDeviceDisconnected.bind(this));

        // set listener for messages from uart service
        if (this._robotUart.addEventListener) {
            console.log("Receive mesages from uart service");
            this._robotUart.addEventListener("receiveText", this.updateSensors.bind(this));
        }
    }
    onDeviceDisconnected() {
        console.log("Lost connection to robot");
        
        // update peripheral indicator
        this.scratch_vm.emit(this.scratch_vm.constructor.PERIPHERAL_DISCONNECTED);
        this._robotStatus = 1;

        // remove event listeners
        if (this._robotUart.removeEventListener) this._robotUart.removeEventListener("receiveText", this.updateSensors.bind(this));
        this._robotDevice.removeEventListener("gattserverdisconnected", this.onDeviceDisconnected.bind(this));

        // reset robot variables
        this._robotDevice = null;
        this._robotUart = null;
    }
    
    async connectToBLE() {
        console.log("Getting BLE device");

        // for development
        let deviceName = "Bluefruit52"; // "BBC micro:bit"; 
        
        if (window.navigator.bluetooth) {
            try {                
                this._robotDevice = await Doodlebot.requestRobot(window.navigator.bluetooth, deviceName);
                const services = await Doodlebot.getServices(this._robotDevice);

                if (services.uartService) {
                    this._robotUart = services.uartService;

                    this.onDeviceConnected();
                }
            } catch(err) {
                console.log(err);
                if (err.message == "Bluetooth adapter not available.") { 
                    alert("Your device does not support BLE connections.");
                } else {
                    alert("There was a problem connecting your device, please try again or request assistance.");
                }
            }
        }
    }
   
  resetRobot() {
      console.log("Stop everything on robot")
      // go into quiet mode? (q,a)
      // pen up?
      
      // make face neutral
      this.displayFace({FACE: "neutral"});
      // stop motors
      this.stopMotors();
      // turn off lights
      this.pixelsOff();
  }

  /**
   * For reading data back from the device
   */
   updateSensors(event) {
    console.log("Got UART data: " + event.detail);
    }

  /**
   * For setting face display
   */
    displayFace(args) {
        // Translate face to ble protocol command
        const faceCmd = _face_protocol[_faces.indexOf(args.FACE)];
        
        console.log("set face: " + args.FACE + " " + faceCmd);
        // Send message
        if (this._robotUart) this._robotUart.sendText('(d,' + faceCmd + ')');
    }
  /**
   * For clearing the diplay
   */
    clearDisplay(args) {
        console.log("clear display");
        // Send message
        if (this._robotUart) this._robotUart.sendText('(d,c)');    
    }

    //setPixelColor
  /**
   * For setting neopixel colors
   */
   setPixelColor(args) {
    // Translate hex color to binary
    const color = Color.hexToDecimal(args.COLOR);

    // TODO allow different color patterns
    const colorArr = [color, color, color, color, color, color, color, color];

    console.log("set color: " + args.COLOR + " " + colorArr.join(','));

    // Send message
    if (this._robotUart) this._robotUart.sendText('(p,' + colorArr.join(',') + ')');
}
  /**
   * For turning off all of the pixels
   */
   pixelsOff(args) {
    console.log("turning off neopixels");
    // Send message
    if (this._robotUart) this._robotUart.sendText('(p,0,0,0,0,0,0,0,0)');
  }


  /**
   * For activating the motors
   */
    drive(args) {
        // Translate direction to ble protocol command
        let driveCmd = _drive_protocol[_drive.indexOf(args.DIR)];
        
        console.log("drive command: " + args.DIR + " " + driveCmd + " " + args.NUM + " steps");
        // Send message
        if (this._robotUart) this._robotUart.sendText('(m,' + driveCmd + ',' + args.NUM + ',' + args.NUM + ')');  
    }
  /**
   * For activating the motors
   */
    movePen(args) {
        // Translate direction to ble protocol command
        let penCmd = _pen_protocol[_pen_dirs.indexOf(args.DIR)];
        
        console.log("move pen: " + args.DIR + " " + penCmd);
        // Send message
        if (this._robotUart) this._robotUart.sendText('(u,' + penCmd + ')');  
    }
  /**
   * For stopping motors
   */
   stopMotors(args) {
    console.log("stopping motors");
    // Send message
    if (this._robotUart) this._robotUart.sendText('(m,s)');
  }
  
  /**
   * Just for testing out sending commands to robot via ble
   */
  sendCommand (args) {
    let command = args.COMMAND;
    console.log("Sending uart command: ", command);

    if (this._robotUart) this._robotUart.sendText(command);
    else console.log("No device"); // TODO remove debugging statement
  }
 
}
module.exports = DoodlebotBlocks;
