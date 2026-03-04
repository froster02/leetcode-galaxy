import React from 'react';
import Sun from './Sun';
import Planet from './Planet';

export default function SolarSystem({ data }) {
    if (!data || !data.planets) return null;

    return (
        <group>
            <Sun profile={data.profile} />
            {data.planets.map((planet) => (
                <Planet key={planet.name} planetData={planet} />
            ))}
        </group>
    );
}
