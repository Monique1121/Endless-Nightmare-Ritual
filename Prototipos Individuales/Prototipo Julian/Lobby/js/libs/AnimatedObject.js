/*
 * Class for a game object that has animation using a spritesheet
 *
 * Gilberto Echeverria
 * 2026-02-10
 */

"use strict";


class AnimatedObject extends GameObject {
    constructor(position, width, height, color, type, sheetCols) {
        super(position, width, height, color, type);
        this.frame = 0;
        this.minFrame = 0;
        this.maxFrame = 0;
        this.sheetCols = sheetCols;

        this.repeat = true;


        this.frameDuration = 100;
        this.totalTime = 0;
    }

    setAnimation(minFrame, maxFrame, repeat, duration) {
        this.minFrame = minFrame;
        this.maxFrame = maxFrame;
        this.frame = minFrame;
        this.repeat = repeat;
        this.totalTime = 0;
        this.frameDuration = duration;

       
    }


updateFrame(deltaTime) {
    this.totalTime += deltaTime;

    if (this.totalTime > this.frameDuration) {
        let restartFrame = this.repeat ? this.minFrame : this.maxFrame;
        this.frame = this.frame == this.maxFrame ? restartFrame : this.frame + 1;

        const col = this.frame % this.sheetCols;
        const row = Math.floor(this.frame / this.sheetCols);

        const offsetX = this.sheetOffsetX || 0;
        const offsetY = this.sheetOffsetY || 0;
        const stepX = this.sheetStepX || this.spriteRect.width;
        const stepY = this.sheetStepY || this.spriteRect.height;

        this.spriteRect.x = offsetX + col * stepX;
        this.spriteRect.y = offsetY + row * stepY;

        this.totalTime = 0;
    }
}


}