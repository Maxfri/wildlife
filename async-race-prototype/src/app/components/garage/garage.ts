import {
  getWinner, updateWinner, createWinner, deleteWinner,
} from '../../../api/winners/winners.api';
import { startEngine, drive, stopEngine } from '../../../api/engine/engine.api';
import { Car } from '../car/car';
import {
  createCar, deleteCar, getCars, updateCar,
} from '../../../api/garage/garage.api';
import { BaseComponent } from '../base-component';

import './garage.scss';
import store from '../../state/store';

export type Cars = { id: number, name: string, color: string, timer: NodeJS.Timeout, driveStatus: boolean };

const CARS_MARKS = [
  'LADA',
  'UAZ',
  'AURUS',
  'AVTOVAZ',
  'GAZ',
  'Moskvich',
  'YO-car',
  'ZIL',
  'KAMAZ',
  'Dodge',
  'Chevrolet',
  'Cadillac',
  'Renault',
  'Mazda',
  'Hummer',
];

const CARS_MODELS = [
  'Largus',
  'Patriot',
  'Granta',
  'Senat S600',
  'XRAY',
  'Vesta',
  'Logan',
  '3310',
  'Niva',
  'Pajero',
  'Outlander',
  'Rapid',
  'Octavia',
  'Nexia',
  'Tahoe',
];

export class Garage extends BaseComponent {
  carsList: Cars[] = [];

  move = true;

  raceStartTime: Date;

  constructor() {
    super('div', ['garage']);
    document.body.appendChild(this.render());

    const next = document.querySelector('#next-garage');
    const prev = document.querySelector('#prev-garage');

    const finishMessage = <HTMLElement>document.createElement('div');
    finishMessage.classList.add('finish-winners');
    finishMessage.style.visibility = 'hidden';
    document.body.appendChild(finishMessage);

    next?.addEventListener('click', () => {
      store.carPage++;
      this.renderGarage(store.carPage);
    });
    prev?.addEventListener('click', () => {
      store.carPage--;
      this.renderGarage(store.carPage);
    });
  }

  render() {
    this.element.innerHTML = `<div id="garage-view">
        <div>
          <form class="form" id="create">
            <input class="input" id="create-name" name="name" value="" type="text">
            <input class="color" id="create-color" name="color" type="color" value="#ffffff">
            <button class="button" type="submit">Create</button>
          </form>
          <form class="form" id="update">
            <input class="input" id="update-name" name="name" value="" type="text">
            <input class="color" id="update-color" name="color" type="color" value="#ffffff">
            <button class="button" type="submit">Update</button>
          </form>
        </div>
        <div class="race">
          <button class="start-race">Start Race</button>
          <button class="stop-race">Stop</button>
          <button class="random">Create 100 random cars</button>
        </div>
        <div id="garage">
         
        </div>
        <button id="prev-garage">Prev page</button>
        <button id="next-garage">Next page</button>
      </div>`;
    this.renderGarage(store.carPage);
    return this.element;
  }

  async renderGarage(pageNumber: number) {
    const cars = (await getCars(pageNumber)).items;
    const carsCount = (await getCars(pageNumber)).count;
    const garagePage = <HTMLDivElement>document.querySelector('#garage');
    const garage = document.createElement('div');
    this.carsList = [];
    garage.innerHTML = `<h1>Garage (${carsCount})</h1>
        <h2>Page (${store.carPage})</h2>
        <ul class="garage-list">
        ${cars.map((car: Cars) => {
    this.carsList.push(car);
    return `<li>${this.renderCar(car)}</li>`;
  }).join('')}</ul>`;

    garagePage.innerHTML = '';
    garagePage.appendChild(garage);
    await this.listenStartCar();
    await this.removeCar();
    await this.editCar();
  }

  async removeCar() {
    const removeButtons = document.querySelectorAll('.remove');
    removeButtons.forEach((remove) => {
      remove.addEventListener('click', async () => {
        const id = <number><unknown>remove.attributes[1].value;
        await deleteCar(id);
        await deleteWinner(id);
        await this.renderGarage(store.carPage);
      });
    });
  }

  async editCar() {
    const editButtons = document.querySelectorAll('.edit');
    editButtons.forEach((edit) => {
      edit.addEventListener('click', () => {
        const id = Number(edit.attributes[1].value);
        this.carsList.forEach((car) => {
          if (car.id === id) {
            const updateName = <HTMLInputElement>document.querySelector('#update-name');
            const updateColor = <HTMLInputElement>document.querySelector('#update-color');
            updateName.value = car.name;
            updateColor.value = car.color;
            this.listenEdit(id);
          }
        });
      });
    });
  }

  listenEdit = (id: number) => {
    const edit = <HTMLFormElement>document.querySelector('#update');
    edit.onsubmit = async (e) => {
      e.preventDefault();
      const carName = (<HTMLInputElement>document.querySelector('#update-name')).value;
      const carColor = (<HTMLInputElement>document.querySelector('#update-color')).value;
      const car = { carName, carColor };
      await updateCar(id, car);
      await this.renderGarage(store.carPage);
    };
  };

  async listenStartCar() {
    const startButton = document.querySelectorAll('.engine-start');
    const stopButton = document.querySelectorAll('.engine-stop');
    const raceButton = document.querySelector('.start-race');
    const stopRaceButton = document.querySelector('.stop-race');

    raceButton?.addEventListener('click', () => {
      this.raceCars();
    });

    stopRaceButton?.addEventListener('click', () => {
      this.resetCars();
    });

    startButton.forEach((start) => {
      start.addEventListener('click', async () => {
        const startId = Number(start.attributes[1].value);
        await this.startCar(startId);

        stopButton.forEach((stop) => {
          const stopId = Number(stop.attributes[1].value);
          stop.addEventListener('click', async () => {
            this.carsList.forEach(async (car) => {
              if (car.id === stopId) {
                clearInterval(car.timer);
                await this.stopRace(car.id);
              }
            });
          });
        });
      }, false);
    });
  }

  async startCar(id: number) {
    const start = await startEngine(id);
    const { velocity, distance } = start;
    this.race(id, velocity, distance);

    const status = await drive(id);
    if (status.success === false) {
      this.carsList.forEach((car) => {
        if (car.id === id) {
          clearInterval(car.timer);
        }
      });
      await stopEngine(id);
    }
  }

  race(id: number, velocity: number, distance: number): void {
    const carItem = <HTMLElement>document.getElementById(`car-image-${id}`);
    const shift = velocity / 10;
    let speed = shift;
    const raceStartTime = new Date();
    const timer = setInterval(async () => {
      if (carItem !== null && this.move) {
        if (Garage.getPosition(carItem).left >= document.documentElement.clientWidth - 200) {
          this.move = false;
          const raceEndTime = new Date();
          const time = (raceEndTime.getTime() - raceStartTime.getTime());
          this.carsList.forEach((car) => {
            if (car.id === id) {
              Garage.finishCar(car.name, time / 1000);
            }
          });
          const winner = { id, wins: 1, time: time / 1000 };
          try {
            const response = await createWinner(winner);
          } catch {
            let updateCarWins;
            await getWinner(id).then((val) => {
              updateCarWins = val.wins;
            });
            if (updateCarWins) {
              winner.wins = updateCarWins + 1;
            }
            await updateWinner(id, winner);
          }
        } else {
          carItem.style.transform = `translateX(${speed}px) scale(-1,1)`;
          speed += shift;
        }
      }
    }, 25);

    this.carsList.forEach((car) => {
      if (car.id === id) {
        car.timer = timer;
      }
    });
  }

  static finishCar(name: string, time: number) {
    const finishMessage = <HTMLElement>document.querySelector('.finish-winners');
    if (finishMessage) {
      finishMessage.innerHTML = `Winner is ${name} (${time}s)`;
      finishMessage.style.visibility = 'visible';
    }
  }

  async stopRace(id: number) {
    this.move = true;
    await stopEngine(id);
    const carItem = <HTMLElement>document.getElementById(`car-image-${id}`);
    if (carItem) {
      carItem.style.transform = 'translateX(0) scale(-1, 1)';
    }
  }

  async resetCars() {
    if (this.carsList) {
      this.carsList.forEach(async (car) => {
        clearInterval(car.timer);
        await this.stopRace(car.id);
      });
    }
  }

  async raceCars() {
    this.raceStartTime = new Date();
    if (this.carsList) {
      this.carsList.forEach(async (car) => {
        await this.startCar(car.id);
      });
    }
  }

  static getPosition(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
  }

  renderCar = (car: Cars) => {
    const carItem = new Car(car.id, car.name, car.color);
    return carItem.render().outerHTML;
  };

  listen = (formElem: HTMLFormElement) => {
    formElem.onsubmit = async (e) => {
      e.preventDefault();
      const carName = (<HTMLInputElement>document.querySelector('#create-name')).value;
      const carColor = (<HTMLInputElement>document.querySelector('#create-color')).value;
      const car = { carName, carColor };
      await createCar(car);
      await this.renderGarage(store.carPage);
    };
  };

  async createRandomCars() {
    for (let i = 0; i < 100; i++) {
      const carName = `${CARS_MARKS[Math.floor(Math.random() * CARS_MARKS.length)]} ${CARS_MODELS[Math.floor(Math.random() * CARS_MODELS.length)]}`;
      const letters = '0123456789abcdef';
      let carColor = '#';
      for (let j = 0; j < 6; j++) {
        carColor += letters[Math.floor(Math.random() * 16)];
      }
      const car = { carName, carColor };
      createCar(car);
    }
    this.renderGarage(store.carPage);
  }
}
