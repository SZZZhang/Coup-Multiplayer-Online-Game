import React from 'react'

export default function CardStack({ name, number, small }) {

    const backgroundCards = [];

    const CARD_OFFSET = 5;

    if (!number) {
        number = 1
    }

    for (let i = 0; i < number; ++i) {
        backgroundCards.push(
            <div style={{
                key: i,
                position: 'absolute',
                top: i * CARD_OFFSET,
                left: i * CARD_OFFSET,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                height: small ? 100 : 150,
                width: small ? 80 : 120,
                borderWidth: 2,
                borderColor: 'black',
                borderStyle: 'solid',
                backgroundColor: 'white',
                borderRadius: 5,
                boxShadow: '-1px -1px 0 0 #000000',
                fontSize: small ? 11 : 16
            }}>
                <div>
                    {name ? name : '?'}
                </div>
                {
                    number > 1 ?
                        <div>
                            x{number}
                        </div> :
                        null
                }
            </div>
        )
    }

    return (
        <div>
            <div style={{
                position: 'relative',
                height: small ? 120 : 180,
                width: small ? 96 : 144
            }}>
                {backgroundCards}
            </div>
        </div>
    )
}
