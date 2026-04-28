import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { LabelsService } from '../labels/labels.service';
import { ChecklistsService } from '../checklists/checklists.service';

describe('CardsController', () => {
  let controller: CardsController;

  const cardsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
    moveCard: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  const labelsService = {
    addLabelToCard: jest.fn(),
    removeLabelFromCard: jest.fn(),
  };

  const checklistsService = {
    createChecklist: jest.fn(),
    findAllByCard: jest.fn(),
  };

  beforeEach(() => {
    controller = new CardsController(
      cardsService as never,
      labelsService as never,
      checklistsService as never,
    );
    jest.clearAllMocks();
  });

  it('auto assigns the current user when assigneeId is missing', async () => {
    cardsService.create.mockResolvedValue({ id: 'card-1', title: 'Task 1' });

    const createCardDto = {
      title: 'Task 1',
      listId: 'list-1',
    } as never;

    await controller.create(createCardDto, 'user-1');

    expect(cardsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: 'user-1' }),
      'user-1',
    );
  });

  it('delegates remove to cards service', async () => {
    cardsService.remove.mockResolvedValue(undefined);

    await controller.remove('card-1');

    expect(cardsService.remove).toHaveBeenCalledWith('card-1');
  });
});
