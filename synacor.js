const fs = require('fs');

class SynacorChallenge {
    constructor() {
        this.memory = new Array(0x7fff);

        this.registers = new Array(8);

        this.instructions = [
            {
                callback: args => {
                    
                }
            }
        ]
    }

    run() {

    }
}

module.exports = SynacorChallenge;