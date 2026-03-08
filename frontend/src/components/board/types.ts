export interface BoardCard {
  id: string;
  title: string;
}

export interface BoardList {
  id: string;
  title: string;
  cards: BoardCard[];
}
