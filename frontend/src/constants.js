const constants = {};

constants.ACTION_STATE = {
    NONE: 'none',
    CHOOSING_WHO_TO_COUP: 'choosing_who_to_coup',
    CHOOSING_CARD_TO_LOSE: 'choosing_card_to_lose',
    COUNTERACTION: 'counteraction',
    SHOWDOWN: 'showdown',
    CHOOSING_MAIN_ACTION: 'choosing_main_action',
    PICKING_CARDS_TO_EXCHANGE: 'picking_cards_to_exchange',
    CHOOSING_WHO_TO_STEAL_FROM: 'choosing_who_to_steal_from',
    CHOOSING_WHO_TO_ASSASSINATE: 'choosing_who_to_assassinate'
};

constants.GAME_STATE = {
    JOIN_ROOM: 'join_room',
    LOBBY: 'lobby',
    IN_GAME: 'in_game',
    LOST_GAME: 'lost_game',
    WON_GAME: 'won_game'
};

export default constants;