import { CollisionMask } from './collision-mask';
import { GraphicsAdapter } from '..';

export abstract class ForceGenerator {
    abstract updateCollider(collider: CollisionMask, delta: number): void;
    
    render(collider: CollisionMask, adapter: GraphicsAdapter) {
        adapter.renderForceGenerator(collider, this);
    }
}
