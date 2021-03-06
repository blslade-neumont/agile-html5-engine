import { CollisionMask } from './collision-mask';
import { ForceGenerator } from './force-generator';
import { pointDistance, pointDirection, degToRad } from '../utils/math';

export class SpringForceGenerator extends ForceGenerator {
    constructor(public other: CollisionMask, public springConstant: number, public restLength: number) {
        super();
    }
    
    enabled = true;
    modifyOther = true;
    
    updateCollider(collider: CollisionMask, delta: number) {
        if (!this.enabled || (collider.isFixed && (!this.modifyOther || this.other.isFixed))) return;
        
        let [hdist, vdist] = [collider.gameObject.x - this.other.gameObject.x, collider.gameObject.y - this.other.gameObject.y];
        let magnitude = pointDistance(0, 0, hdist, vdist);
        magnitude = (this.restLength - magnitude) / 100;
        magnitude *= this.springConstant;
        
        let [hforce, vforce] = [hdist * magnitude * delta, vdist * magnitude * delta];
        let massRatio = collider.mass / (collider.mass + this.other.mass);
        collider.addForce(hforce * (1 - massRatio), vforce * (1 - massRatio));
        if (this.modifyOther) this.other.addForce(-hforce * massRatio, -vforce * massRatio);
    }
    
    renderContext2d(collider: CollisionMask, context: CanvasRenderingContext2D) {
        context.save();
        try {
            context.translate(collider.gameObject.x, collider.gameObject.y);
            context.rotate(-degToRad(pointDirection(collider.gameObject.x, collider.gameObject.y, this.other.gameObject.x, this.other.gameObject.y)));
            let dist = pointDistance(collider.gameObject.x, collider.gameObject.y, this.other.gameObject.x, this.other.gameObject.y);
            
            context.fillStyle = 'rgba(255, 255, 255, .2)';
            context.fillRect(0, -6, dist, 12);
            context.fillStyle = 'rgba(255, 255, 255, .8)';
            context.fillRect(0, -1.5, this.restLength, 3);
            
            context.strokeStyle = 'black';
            context.lineWidth = 2;
            context.beginPath();
            for (let q = 0; q < dist - 5; q += 10) {
                context.lineTo(q, 0);
                context.lineTo(q + 2.5, 4);
                context.lineTo(q + 7.5, -4);
                context.lineTo(q + 10, 0);
            }
            context.stroke();
        }
        finally { context.restore(); }
    }
}
