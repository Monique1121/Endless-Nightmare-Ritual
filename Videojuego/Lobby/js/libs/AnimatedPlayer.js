/*
 * Class for the principal game object in a simple game
 * This object will have animation for some of its actions
 *
 * Gilberto Echeverria
 * 2026-02-22
 */



class AnimatedPlayer extends AnimatedObject {
    constructor( position, width, height, color, sheetCols, motion ) {
        super(
            position,
            width,
            height,
            color,
            "player",
            sheetCols
        );
        this.velocity = new Vector(0, 0);
        this.speed = 1.0;
        this.sheetCols = sheetCols;
        this.keys = [];
        this.motion = motion;
    }

    update(deltaTime, canvas) {

        this.velocity.x = 0;
        this.velocity.y = 0;

        for (const direction of this.keys) {
            const axis = this.motion[direction].axis;
            const sign = this.motion[direction].sign;
            this.velocity[axis] += sign;

        
            const dirData = this.motion[direction];
     
            if (!dirData.status) {
                dirData.status = true;
                this.setAnimation(...dirData.moveFrames, dirData.repeat, dirData.duration);
            }
        }
        // velocity diagonales normalized to the speed
        this.velocity = this.velocity.normalize().times(this.speed);
        this.position = this.position.plus(this.velocity.times(deltaTime));

        this.clampWithinCanvas(canvas);

        this.updateFrame(deltaTime);

 
        this.updateCollider();
    }

    clampWithinCanvas(canvas) {
        // Top border
        if (this.position.y - this.halfSize.y < 0) {
            this.position.y = this.halfSize.y;
        // Left border
        }
        if (this.position.x - this.halfSize.x < 0) {
            this.position.x = this.halfSize.x;
        // Bottom border
        }
        if (this.position.y + this.halfSize.y > canvas.height) {
            this.position.y = canvas.height - this.halfSize.y;
        // Right border
        }
        if (this.position.x + this.halfSize.x > canvas.width) {
            this.position.x = canvas.width - this.halfSize.x;
        }
    }

    setSpeed(newSpeed) {
        this.speed = newSpeed;
    }


    startMovement(direction) {

        const dirData = this.motion[direction];
        if (!dirData.status) {
            dirData.status = true;
            this.setAnimation(...dirData.moveFrames, dirData.repeat, dirData.duration);
        }
    }

    stopMovement(direction) {
        const dirData = this.motion[direction];
        dirData.status = false;
        this.setAnimation(...dirData.idleFrames, dirData.repeat, dirData.duration);
    }

}
