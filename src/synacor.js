const fs = require('fs');
const prompt = require('prompt-sync')({ sigint: true });

class SynacorChallenge {
    constructor() {
        this.registers = new Array(8).fill(0);

        this.memory = new Array(0x7fff);
        this.stack = [];
        this.halted = false;
        this.programCounter = 0;
        this.args = [];
        this.currentInput = '';
        
        let program = fs.readFileSync('./src/challenge.bin');
        for (let i = 0; i < this.memory.length; i++) {
            if (program[i * 2] != null) this.memory[i] = program[i * 2 + 1] << 8 | program[i * 2 + 0];
            else this.memory[i] = 0;
        }
        
        this.instructions = [
            {
                length: 1,
                callback: synacor => {
                    synacor.halted = true;
                    return false;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    synacor.setValue(synacor.args[0], synacor.getValue(synacor.args[1]));
                    return false;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.stack.push(synacor.getValue(synacor.args[0]));
                    return false;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.setValue(synacor.args[0], synacor.stack.pop());
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) == synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value ? 1 : 0);
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) > synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value ? 1 : 0);
                    return false;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.programCounter = synacor.getValue(synacor.args[0]);
                    return true;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    if (synacor.getValue(synacor.args[0]) != 0) {
                        synacor.programCounter = synacor.getValue(synacor.args[1]);
                        return true;
                    }
                    return false;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    if (synacor.getValue(synacor.args[0]) == 0) {
                        synacor.programCounter = synacor.getValue(synacor.args[1]);
                        return true;
                    }
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) + synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value % 32768);
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) * synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value % 32768);
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) % synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) & synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) | synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = ~synacor.getValue(synacor.args[1]) & 0x7fff;
                    synacor.setValue(synacor.args[0], value);
                    return false;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = synacor.memory[synacor.getValue(synacor.args[1])];
                    synacor.setValue(synacor.args[0], value);
                    return false;
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]);
                    synacor.setValue(synacor.getValue(synacor.args[0]), value);
                    return false;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.stack.push(synacor.programCounter + 2);
                    synacor.programCounter = synacor.getValue(synacor.args[0]);
                    return true;
                }
            },
            {
                length: 1,
                callback: synacor => {
                    if (synacor.stack.length == 0) synacor.halted = true;
                    else synacor.programCounter = synacor.stack.pop();
                    return true;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    process.stdout.write(String.fromCharCode(synacor.getValue(synacor.args[0])));
                    return false;
                }
            },
            {
                length: 2,
                callback: synacor => {
                    if (synacor.currentInput == '') synacor.currentInput = prompt('Synacor Challenge Input: ') + '\n';
                    
                    let special = {
                        try_all: () => {
                            synacor.currentInput = 'doorway\n';
                        }
                    }
                    
                    if (special[synacor.currentInput.replace(/\n/, '')]) special[synacor.currentInput.replace(/\n/, '')]();
                    else {
                        let character = synacor.currentInput.charAt(0);
                        synacor.currentInput = synacor.currentInput.slice(1);
                        synacor.setValue(synacor.args[0], character.codePointAt(0));
                    }
                    return false;
                }
            },
            {
                length: 1,
                callback: synacor => {
                    return false;
                }
            }
        ]
    }
    
    getValue(address) {
        let result = this.checkAddress(address);
        return (result.type == 'address') ? result.value : this.registers[result.value];
    }
    
    setValue(address, value) {
        let result = this.checkAddress(address);
        this[(result.type == 'address') ? 'memory' : 'registers'][result.value] = value;
    }
    
    checkAddress(address) {
        if (address >= 0 && address <= 32767) {
            return { type: 'address', value: address };
        } else if (address >= 32768 && address <= 32775) {
            return { type: 'register', value: address % 32768 };
        } else {
            throw new Error(`Invalid address: ${address}`);
        }
    }

    run() {
        while (!this.halted) {
            let opcode = this.memory[this.programCounter];

            this.args = [];
            for (let i = 1; i <= 3; i++) this.args.push(this.memory[this.programCounter + i]);
            
            let jump = this.instructions[opcode].callback(this);
            if (!jump) this.programCounter += this.instructions[opcode].length;
        }
    }
}

module.exports = SynacorChallenge;