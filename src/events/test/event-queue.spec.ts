﻿/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { EventQueue } from '../event-queue';
import { MouseButton } from '../events';
import { delay } from '../../utils/delay';
import { Game } from '../../game';

let nop = () => void(0);

describe('EventQueue', () => {
    let events: EventQueue;
    
    describe('keyboard input', () => {
        beforeEach(() => {
            events = new EventQueue();
            events.init();
            (<any>events)._currentInput = 'keyboard';
        });
        
        describe('onkeydown', () => {
            it('should emit a keyPressed and keyTyped event the first time a key is pressed', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'keyPressed',
                    code: 'ArrowUp',
                    altPressed: false,
                    ctrlPressed: false,
                    shiftPressed: false
                }, {
                    type: 'keyTyped',
                    key: 'ArrowUp',
                    code: 'ArrowUp',
                    altPressed: false,
                    ctrlPressed: false,
                    shiftPressed: false
                }]);
            });
            it('should emit only a keyTyped event subsequent times a key is pressed', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                events.clearQueue();
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'keyTyped',
                    key: 'ArrowUp',
                    code: 'ArrowUp',
                    altPressed: false,
                    ctrlPressed: false,
                    shiftPressed: false
                }]);
            });
            it('should invoke console.log if DEBUG_KEYS is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_KEYS = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/key pressed/i));
                } finally { if (stub) stub.restore(); }
            });
        });
        
        describe('onkeyup', () => {
            it('should emit a keyReleased event when a key is released', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                events.clearQueue();
                body.onkeyup(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'keyReleased',
                    code: 'ArrowUp',
                    altPressed: false,
                    ctrlPressed: false,
                    shiftPressed: false
                }]);
            });
            it('should not emit a keyReleased event if a duplicate key release event is triggered', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                body.onkeyup(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                events.clearQueue();
                body.onkeyup(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([]);
            });
            it('should invoke console.log if DEBUG_KEYS is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_KEYS = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onkeyup(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/key released/i));
                } finally { if (stub) stub.restore(); }
            });
        });

        describe('.isKeyDown', () => {
            it('should return false before the key has been pressed', () => {
                expect(events.isKeyDown('ArrowUp')).to.be.false;
            });
            it('should return true after the key has been pressed', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.isKeyDown('ArrowUp')).to.be.true;
            });
            it('should return false after the key has been pressed and released', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onkeydown(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                body.onkeyup(<any>{ code: 'ArrowUp', key: 'ArrowUp', preventDefault: nop });
                expect(events.isKeyDown('ArrowUp')).to.be.false;
            });
        });
    });
    
    describe('mouse input', () => {
        beforeEach(() => {
            events = new EventQueue();
            events.init();
            (<any>events)._currentInput = 'mouse';
        });
        
        describe('onmousemove', () => {
            it('should emit a mouseMove event when the mouse is moved', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousemove(<any>{ movementX: -3, movementY: 3, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseMoved',
                    movementX: -3,
                    movementY: 3,
                    pageX: -3,
                    pageY: 3
                }]);
            });
            it('should emit only one mouseMove event per frame even if multiple are fired', () => {
                sinon.spy(events, 'enqueue');
                let body = document.getElementsByTagName('body')[0];
                body.onmousemove(<any>{ movementX: -3, movementY: 3, preventDefault: nop });
                body.onmousemove(<any>{ movementX: -1, movementY: -2, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseMoved',
                    movementX: -4,
                    movementY: 1,
                    pageX: -4,
                    pageY: 1
                }]);
                expect(events.enqueue).to.have.been.calledTwice;
            });
            it('should set the mouse position if one is defined', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousemove(<any>{ button: 0, movementX: 999, movementY: 999, pageX: 97, pageY: 83, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 97, y: 83 });
            });
            it('should infer the mouse position if only the movement vector is defined', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousemove(<any>{ button: 0, movementX: -13, movementY: 79, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: -13, y: 79 });
            });
            it('should invoke console.log if DEBUG_MOUSE_VERBOSE is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_MOUSE_VERBOSE = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onmousemove(<any>{ movementX: 0, movementY: 0, preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/mouse moved/i));
                } finally { if (stub) stub.restore(); }
            });
        });
        
        describe('onmousedown', () => {
            it('should emit a mouseButtonPressed event when a mouse button is pressed', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseButtonPressed',
                    button: MouseButton.Left,
                    pageX: 0,
                    pageY: 0
                }]);
            });
            it('should not emit a mouseButtonPressed event if a duplicate mouse button event is triggered', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                events.clearQueue();
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([]);
            });
            it('should set the mouse position if one is defined', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, pageX: 42, pageY: 13, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 42, y: 13 });
            });
            it('should invoke console.log if DEBUG_MOUSE is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_MOUSE = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onmousedown(<any>{ button: 0, preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/mouse button pressed/i));
                } finally { if (stub) stub.restore(); }
            });
        });
        
        describe('onmouseup', () => {
            it('should emit a mouseButtonReleased event when a mouse button is released', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                events.clearQueue();
                body.onmouseup(<any>{ button: 0, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseButtonReleased',
                    button: MouseButton.Left,
                    pageX: 0,
                    pageY: 0
                }]);
            });
            it('should not emit a mouseButtonReleased event if a duplicate mouse button event is triggered', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                body.onmouseup(<any>{ button: 0, preventDefault: nop });
                events.clearQueue();
                body.onmouseup(<any>{ button: 0, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([]);
            });
            it('should set the mouse position if one is defined', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                body.onmouseup(<any>{ button: 0, pageX: 42, pageY: 13, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 42, y: 13 });
            });
            it('should invoke console.log if DEBUG_MOUSE is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_MOUSE = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onmouseup(<any>{ button: 0, preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/mouse button released/i));
                } finally { if (stub) stub.restore(); }
            });
        });
        
        describe('onmousewheel', () => {
            it('should emit a mouseWheel event when the wheel is moved', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onwheel(<any>{ deltaY: -4, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseWheel',
                    delta: -4,
                    pageX: 0,
                    pageY: 0
                }]);
            });
            it('should emit only one mouseWheel event per frame even if multiple are fired', () => {
                sinon.spy(events, 'enqueue');
                let body = document.getElementsByTagName('body')[0];
                body.onwheel(<any>{ deltaY: -4, preventDefault: nop });
                body.onwheel(<any>{ deltaY: -5, preventDefault: nop });
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'mouseWheel',
                    delta: -9,
                    pageX: 0,
                    pageY: 0
                }]);
                expect(events.enqueue).to.have.been.calledTwice;
            });
            it('should set the mouse position if one is defined', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onwheel(<any>{ button: 0, movementX: 999, movementY: 999, pageX: 97, pageY: 83, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 97, y: 83 });
            });
            it('should invoke console.log if DEBUG_MOUSE is true', () => {
                let stub: sinon.SinonStub | null = null;
                try {
                    stub = sinon.stub(console, 'log');
                    (<any>events).DEBUG_MOUSE = true;
                    let body = document.getElementsByTagName('body')[0];
                    body.onwheel(<any>{ wheelDelta: 13, preventDefault: nop });
                    expect(console.log).to.have.been.calledWith(sinon.match(/mouse wheel/i));
                } finally { if (stub) stub.restore(); }
            });
        });
        
        describe('.isMouseButtonDown', () => {
            it('should return false before the mouse button has been pressed', () => {
                expect(events.isMouseButtonDown(MouseButton.Left)).to.be.false;
            });
            it('should return true after the mouse button has been pressed', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                expect(events.isMouseButtonDown(MouseButton.Left)).to.be.true;
            });
            it('should return false after the mouse button has been pressed and released', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, preventDefault: nop });
                body.onmouseup(<any>{ button: 0, preventDefault: nop });
                expect(events.isMouseButtonDown(MouseButton.Left)).to.be.false;
            });
        });

        describe('.mousePosition', () => {
            it('should start at (0, 0)', () => {
                expect(events.mousePosition).to.deep.eq({ x: 0, y: 0 });
            });
            it('should be updated when a mouse event sets the page position', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousedown(<any>{ button: 0, pageX: 30, pageY: 40, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 30, y: 40 });
            });
            it('should be updated when mouse move events occur', () => {
                let body = document.getElementsByTagName('body')[0];
                body.onmousemove(<any>{ button: 0, movementX: 60, movementY: 40, preventDefault: nop });
                body.onmousemove(<any>{ button: 0, movementX: -20, movementY: 30, preventDefault: nop });
                expect(events.mousePosition).to.deep.eq({ x: 40, y: 70 });
            });
        });
    });
    
    describe('canvas resize', () => {
        let game: Game;
        beforeEach(() => {
            game = new Game();
            events = game.eventQueue;
            game.start();
        });
        afterEach(() => {
            if (game.isRunning) game.stop();
        });
        
        describe('onresize', () => {
            it('should emit a canvasResize event when the body is resized', () => {
                [(<any>window).innerWidth, (<any>window).innerHeight] = [123, 456];
                window.onresize(<any>void(0));
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'canvasResize',
                    previousSize: [0, 0],
                    size: [123, 456],
                    adapter: game.graphicsAdapter
                }]);
            });
            it('should emit only one canvasResize event per frame even if multiple are fired', () => {
                sinon.spy(events, 'enqueue');
                [(<any>window).innerWidth, (<any>window).innerHeight] = [123, 456];
                window.onresize(<any>void(0));
                [(<any>window).innerWidth, (<any>window).innerHeight] = [234, 567];
                window.onresize(<any>void(0));
                expect(events.clearQueue()).to.deep.eq([{
                    type: 'canvasResize',
                    previousSize: [0, 0],
                    size: [234, 567],
                    adapter: game.graphicsAdapter
                }]);
                expect(events.enqueue).to.have.been.calledTwice;
            });
        });
    });
    
    describe('.enqueue', () => {
        beforeEach(() => {
            events = new EventQueue();
        });
        
        it('should queue the event to be returned the next time clearQueue is called', () => {
            let e = <any>{ type: 'fish!' };
            events.enqueue(e);
            expect(events.clearQueue()).to.deep.eq([e]);
        });
    });
    
    describe('.clearQueue', () => {
        beforeEach(() => {
            events = new EventQueue();
        });
        
        it('should return an empty array if there are no events', () => {
            expect(events.clearQueue()).to.deep.eq([]);
        });
        it('should not return the same event twice', () => {
            let e = <any>{ type: 'fish!' };
            events.enqueue(e);
            expect(events.clearQueue()).to.deep.eq([e]);
            expect(events.clearQueue()).to.deep.eq([]);
        });
    });
});
