'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(objVector) {
    if (!(objVector instanceof Vector)) {
      throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(this.x + objVector.x, this.y + objVector.y);
  }
  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(position instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error(`Не верный тип`);
    }
    this.pos = position;
    this.size = size;
    this.speed = speed;
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
  get type() {
    return 'actor';
  }

  isIntersect(objActor) {
    if (!objActor || !(objActor instanceof Actor)) {
      throw new Error(`Данные не  верного типа`);
    }
    if (objActor === this) {
      return false;
    } else {
      return this.left < objActor.right &&
        this.top < objActor.bottom &&
        this.right > objActor.left &&
        this.bottom > objActor.top;
    }
  }
  act() {

  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find(actor => actor.type === 'player');
    this.height = grid.length;
    this.width = grid.reduce(((max, arr) => (arr.length > max) ? arr.length : max), 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }
  actorAt(objActor) {
    if (!objActor || !(objActor instanceof Actor)) {
      throw new Error(`Данные не  верного типа`);
    }
    return this.actors.find(item => item.isIntersect(objActor));
  }
  obstacleAt(posTo = new Vector(), size = new Vector(1, 1)) {
    if (!(posTo instanceof Vector) || !(size instanceof Vector)) {
      throw new Error(`Не верный тип`);
    }
    const leftWall = Math.floor(posTo.x);
    const rightWall = Math.ceil(posTo.x + size.x);
    const topWall = Math.floor(posTo.y);
    const lava = Math.ceil(posTo.y + size.y);

    if (leftWall < 0 || rightWall > this.width || topWall < 0) {
      return 'wall';
    }
    if (lava > this.height) {
      return 'lava';
    }
    for (let x = leftWall; x < rightWall; x++) {
      for (let y = topWall; y < lava; y++) {
        if (this.grid[y][x] === 'wall' || this.grid[y][x] === 'lava') {
          return this.grid[y][x];
        }
      }
    }
  }
  removeActor(objActor) {
    let removableActor = this.actors.indexOf(objActor);
    if (removableActor !== -1) {
      this.actors.splice(removableActor, 1);
    }
  }
  noMoreActors(type) {
    return !(this.actors.find(item => item.type === type));
  }
  playerTouched(typeStr, objActor) {
    if (typeStr === 'lava' || typeStr === 'fireball') {
      this.status = 'lost';
    }
    if (typeStr === 'coin' && objActor.type === 'coin') {
      this.removeActor(objActor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(SymbolString) {
    if (SymbolString) {
      return this.dictionary[SymbolString];
    }
  }
  obstacleFromSymbol(SymbolString) {
    switch (SymbolString) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
    }
  }
  createGrid(arrayStrings) {
    return arrayStrings.map(str => {
      return str.split('').map(el => {
        if (el === 'x') {
          el = 'wall';
        } else if (el === '!') {
          el = 'lava';
        } else {
          el = undefined;
        }
        return el;
      })
    })
  }
  createActors(arrayStrings) {
    const actors = [];
    arrayStrings.forEach((elY, y) => {
      elY.split('').forEach((elX, x) => {
        let constructor = this.actorFromSymbol(elX);
        if (typeof constructor !== 'function') return;
        let res = new constructor(new Vector(x, y));
        if (res instanceof Actor) actors.push(res);
      });
    });
    return actors;
  }

  parse(arrayStrings) {
    return new Level(this.createGrid(arrayStrings), this.createActors(arrayStrings));
  }
}

class Fireball extends Actor {
  constructor(position, speed) {
    let size = new Vector(1, 1);
    super(position, size, speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, grid) {
    let nextPosition = this.getNextPosition(time);
    if (grid.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = this.getNextPosition(time);
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(position) {
    super(position, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(position) {
    super(position, new Vector(0, 3));
    this.prevPosition = position;
  }
  handleObstacle() {
    this.pos = this.prevPosition;
  }
}


class Coin extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0.6, 0.6));
    this.pos = position.plus(new Vector(0.2, 0.1));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    this.startPos = this.pos;
  }
  get type() {
    return 'coin';
  }
  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0.8, 1.5));
    this.pos = position.plus(new Vector(0, -0.5));
  }
  get type() {
    return 'player';
  }
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
};
const parser = new LevelParser(actorDict);

loadLevels()
  .then((res) => {
    runGame(JSON.parse(res), parser, DOMDisplay)
      .then(() => alert('Вы выиграли!'))
  });    
  
   
