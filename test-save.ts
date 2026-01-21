import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:2530/api',
});

async function testSave() {
    const payload = {
        planNo: 'TEST-' + Date.now(),
        revisionNo: '00',
        refProductionNo: 'REF-001',
        issuedDate: '21 Jan 26',
        issueBy: 'Test Runner',
        rows: [
            {
                date: '21 Jan 26',
                dayOfWeek: 'Wed',
                shift: '1st',
                productionMode: 'normal',
                grade: 'P0263',
                ratioUSS: '10',
                ratioCL: '20',
                ratioBK: '30',
                productTarget: '100',
                clConsumption: '50',
                ratioBorC: '5',
                plan1Pool: ['1', '2'],
                plan1Scoops: 5,
                plan1Grades: ['AA'],
                remarks: 'Test Save'
            }
        ],
        poolDetails: [
            {
                poolNo: '1',
                grossWeight: '10',
                netWeight: '9',
                drc: '90',
                grade: ['AA']
            }
        ]
    };

    try {
        console.log('Sending Test Save Payload...');
        const response = await api.post('/raw-material-plans', payload);
        console.log('Success! Created ID:', response.data.id);
        console.log('Response Plan No:', response.data.planNo);
    } catch (err: any) {
        console.error('Save Failed:', err.response?.data || err.message);
    }
}

testSave();
