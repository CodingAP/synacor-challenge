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
        this.debug = false;
        
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
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 3,
                callback: synacor => {
                    synacor.setValue(synacor.args[0], synacor.getValue(synacor.args[1]));
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.stack.push(synacor.getValue(synacor.args[0]));
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.setValue(synacor.args[0], synacor.stack.pop());
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) == synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value ? 1 : 0);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) > synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value ? 1 : 0);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.programCounter = synacor.getValue(synacor.args[0]);
                    return true;
                },
                disassemble: synacor => {
                    return 'HALT';
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
                },
                disassemble: synacor => {
                    return 'HALT';
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
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) + synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value % 32768);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) * synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value % 32768);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) % synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) & synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 4,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]) | synacor.getValue(synacor.args[2]);
                    synacor.setValue(synacor.args[0], value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = ~synacor.getValue(synacor.args[1]) & 0x7fff;
                    synacor.setValue(synacor.args[0], value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = synacor.memory[synacor.getValue(synacor.args[1])];
                    synacor.setValue(synacor.args[0], value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 3,
                callback: synacor => {
                    let value = synacor.getValue(synacor.args[1]);
                    synacor.setValue(synacor.getValue(synacor.args[0]), value);
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    synacor.stack.push(synacor.programCounter + 2);
                    synacor.programCounter = synacor.getValue(synacor.args[0]);
                    return true;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 1,
                callback: synacor => {
                    if (synacor.stack.length == 0) synacor.halted = true;
                    else synacor.programCounter = synacor.stack.pop();
                    return true;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    process.stdout.write(String.fromCharCode(synacor.getValue(synacor.args[0])));
                    return false;
                },
                disassemble: synacor => {
                    return 'HALT';
                }
            },
            {
                length: 2,
                callback: synacor => {
                    if (synacor.currentInput == '') synacor.currentInput = prompt() + '\n';
                    
                    let special = {
                        change_destination: args => {
                            synacor.registers[7] = parseInt(args[0]);
                            synacor.currentInput = '\n';
                        },
                        get_registers: args => {
                            console.log(synacor.registers.join(','));
                            synacor.currentInput = '\n';
                        },
                        save: args => {
                            let file = `./src/saves/${args[0]}.sav`;
                            let content = '';
                            content += synacor.registers.join(',') + '\n';
                            content += synacor.stack.join(',') + '\n';
                            content += synacor.memory.join(',') + '\n';
                            content += synacor.programCounter;

                            fs.writeFileSync(file, content);
                            console.log(`Saved ${args[0]}.sav!`)

                            synacor.currentInput = '\n';
                        },
                        load: args => {
                            let file = `./src/saves/${args[0]}.sav`;
                            let content = fs.readFileSync(file).toString();
                            let [registers, stack, memory, programCounter] = content.split('\n');

                            synacor.registers = registers.split(',').map(value => parseInt(value));
                            synacor.stack = stack.split(',').map(value => parseInt(value));
                            synacor.memory = memory.split(',').map(value => parseInt(value));
                            synacor.programCounter = parseInt(programCounter);
                            
                            console.log(`Loaded ${args[0]}.sav!`)

                            synacor.currentInput = '\n';
                        }
                    }
                    
                    let tokens = synacor.currentInput.replace(/\n/, '').split(' ');
                    if (special[tokens[0]]) special[tokens[0]](tokens.slice(1));

                    let character = synacor.currentInput.charAt(0);
                    synacor.currentInput = synacor.currentInput.slice(1);
                    synacor.setValue(synacor.args[0], character.codePointAt(0));
                    return false;
                },
                disassemble: synacor => {
                    return 'IN ';
                }
            },
            {
                length: 1,
                callback: synacor => {
                    return false;
                },
                disassemble: synacor => {
                    return 'NOOP';
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