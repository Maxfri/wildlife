import { Timer } from '../timer/timer';
import { CardsField } from '../cards-field/cards-field';
import { Card } from '../card/card';
import { BaseComponent } from '../base-component';
import { delay } from '../../shared/delay';

const FLIP_DELAY = 5000;

export class Game extends BaseComponent {
  private readonly cardsField: CardsField;

  private activeCard?: Card;

  private isAnimation = false;

  private count = 0;

  constructor() {
    super();
    this.cardsField = new CardsField();
    this.element.appendChild(this.cardsField.element);
  }

  newGame(images: string[]) {
    this.cardsField.clear();
    const cards = images
      .concat(images)
      .map((url) => new Card(url))
      .sort(() => Math.random() - 0.5);

    cards.forEach((card) => {
      card.element.addEventListener('click', () => this.cardHandler(card));
    });

    this.cardsField.addCards(cards);
    this.element.prepend(new Timer().element);
  }

  score(): number {
    return this.count++;
  }

  private async cardHandler(card: Card) {
    if (this.isAnimation) return;
    if (!card.isFlipped) return;
    this.isAnimation = true;

    await card.flipToFront();

    if (!this.activeCard) {
      this.activeCard = card;
      this.isAnimation = false;
      return;
    }
    if (this.activeCard.image === card.image) {
      this.score();
    }
    if (this.activeCard.image !== card.image) {
      delay(FLIP_DELAY);
      await Promise.all([this.activeCard.flipToBack(), card.flipToBack()]);
    }

    this.activeCard = undefined;
    this.isAnimation = false;

    if (this.count === 8) {
      // console.log('You win');
    }
  }
}