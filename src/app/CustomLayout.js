"use client"
import { TableTemplate } from '@/components/TableTemplate';
import React, { useEffect, useState } from 'react'

const CustomLayout = () => {

    const [traces, setTraces] = useState([]);

    useEffect(() => {
        const getData = async () => {
            const res = await fetch('/api/getTraces');
            const result = await res.json();
            setTraces(result.data);
        };

        getData();
    }, []);

    console.log(traces);
    return (
        <div className='w-full h-full flex justify-center items-center'>
            <div className=' w-[90%]'>
                <TableTemplate data={traces} list={["input", "output", "model", "provider", "totalCost", "latency"]} />
            </div>
        </div>
    )
}

export default CustomLayout
