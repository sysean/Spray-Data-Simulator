interface Point {
    lat: number;
    lon: number;
    datetime: string;
}

export class GpsSender {
    private timerId: number | null = null;

    private interval: number;

    constructor(interval: number) {
        this.interval = interval;
    }

    setInterval(interval: number): void {
        this.interval = interval;
        if (this.timerId !== null) {
            this.stop();
            this.start();
        }
    }

    start(): void {
        if (this.timerId === null) {
            this.timerId = setInterval(async () => {
                const point = this.getCurrentPoint();
                await this.sendGpsPoint(point);
            }, this.interval);
            console.log('GPS sending started.');
        }
    }

    stop(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
            console.log('GPS sending stopped.');
        }
    }

    private getCurrentPoint(): Point {
        const lat: number = Math.random() * 180 - 90;
        const lon: number = Math.random() * 360 - 180;
        const datetime: string = new Date().toISOString();
        return { lat, lon, datetime };
    }

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