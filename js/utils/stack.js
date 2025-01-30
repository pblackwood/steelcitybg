function Stack(maxSize) {
    this.elements = [];
    this.maxSize = maxSize;
    this.length = 0;
    this.position = -1;
}

Stack.prototype = {

    constructor: Stack,

    clear: function () {
        this.elements = [];
        this.length = 0;
        this.position = -1;
    },

    push: function (item) {
        if (this.length == this.maxSize) {
            this.elements.shift();
        }
        this.elements.push(item);
        this.length = this.elements.length;
        this.position = this.length - 1;
    },

    pop: function () {
        if (this.length == 0) {
            throw Error('Stack is empty');
        }
        this.length--;
        this.position = this.length - 1;
        return (this.elements.pop());
    },

    peek: function () {
        if (this.position < 0 || this.position >= this.length) {
            throw Error('Stack peek out of range');
        }
        return (this.elements[this.position]);
    },

    peekAndMoveUp: function () {
        var elem = this.peek();
        this.position++;
        return elem;
    },

    peekAndMoveDown: function () {
        var elem = this.peek();
        this.position--;
        return elem;
    },

    moveUpAndPeek: function () {
        this.position++;
        return this.peek();
    },

    moveDownAndPeek: function () {
        this.position--;
        return this.peek();
    },

    // Sync the top of the stack to the current position pointer
    reset: function () {
        if (this.position < 0) {
            this.clear();
        } else if (this.position >= this.length) {
            this.position = this.length - 1;
        } else {
            this.elements.splice(this.position + 1, (this.length - this.position) - 1);
            this.length = this.position + 1;
        }
    },

    resetAndPush: function (item) {
        this.reset();
        this.push(item);
    },

    isEmpty: function () {
        return this.length == 0;
    },

    isFull: function () {
        return this.length == this.maxSize;
    },

    // The stack is "reset" when the position pointer is on the top of the stack
    isReset: function () {
        return this.position == (this.length - 1);
    },

    dump: function () {
        return ({
            length: this.length,
            position: this.position,
            maxLength: this.maxSize
        });
    }
}

module.exports = Stack;
