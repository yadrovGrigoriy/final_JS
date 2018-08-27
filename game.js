'use strict';

class Vector {
	constructor(x = 0, y = 0){
		this.x = x;
		this.y = y;
	}
	plus(objVector){
		if (!(objVector instanceof Vector)){
			throw new Error(`Можно прибавлять к вектору только вектор типа Vector`)
		}
		return new Vector(this.x + objVector.x, this.y + objVector.y);
	}
	times(factor){
		return new Vector(this.x * factor, this.y * factor);
	}
}

class Actor {
	constructor(positionObjVector = new Vector(0, 0), sizeObjVector = new Vector(1,1), speedObjVector = new Vector(0, 0)){
		if(!(positionObjVector instanceof Vector) || !(sizeObjVector instanceof Vector) || !(speedObjVector instanceof Vector)){
			throw new Error(`Не верный тип`);
		}
		this.pos = positionObjVector;
		this.size = sizeObjVector;
		this.speed = speedObjVector;
		}
		get left() {
        return this.pos.x;
	    }

	    get top() {
	        return this.pos.y;
	    }

	    get right() {
	        return this.pos.x + this.size.x;
	    }

	    get bottom() {
	        return this.pos.y + this.size.y;
	    }
	    get type(){
	    	return 'actor'
	    }
	
	isIntersect(objActor){
		if (!objActor || !(objActor instanceof Actor)){
			throw new Error(`Данные не  верного типа`)
		}
		if (this === objActor) {
			return false;
		}
		return this.left < objActor.right &&
				this.top < objActor.bottom &&
				this.right > objActor.left &&
				this.bottom > objActor.top
	}	
	act(){

	}
}

class Level {
	constructor(grid = [], actors = []){
		this.grid = grid;
		this.actors = actors;
		this.player = actors.find(actor => actor.type === 'player');
		this.height = grid.length;
		this.width = grid.reduce(((max, arr) => (arr.length > max) ? arr.length : max), 0);
		this.status = null;
		this.finishDelay = 1;
	}

	isFinished(){
		if(this.status !== null && this.finishDelay < 0){
			return true;
		}
		return false;
	}
	actorAt(objActor){
		if (!objActor || !(objActor instanceof Actor)){
			throw new Error(`Данные не  верного типа`)
		}
		return this.actors.find(actor => actor.isIntersect(objActor))
	}
	obstacleAt(posTo = new Vector(), size = new Vector(1, 1) ){
		if (!(posTo instanceof Vector) || !(size instanceof Vector)){
			throw new Error(`Не верный тип`)
		}
		if(posTo.x < 0 || (posTo.x + size.x) > this.width || posTo.y < 0){
			return 'wall';
		}
		 if(posTo.y + size.y > this.height){
			return 'lava';
		}
	}
	removeActor(objActor){
		this.actors.splice(this.actors.indexOf(objActor), 1);
	}
}
