interface Point {
    lat: number;
    lon: number;
    direct: number;
    datetime: string;
    isStart: boolean;
    direction: number;
}

export class GpsSender {
    private timerId: number | null = null;

    async sendGpsPoint(point: Point): Promise<void> {
        try {
            const response = await fetch('/gpspoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(point),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to send GPS point:', error);
        }
    }
}