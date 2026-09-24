export interface CaptchaChallenge {
	sitekey: string;
	rqdata?: string;
	service: string;
	url: string;
}

export class CaptchaPipeline {
	private capsKey?: string;
	private twoKey?: string;

	constructor() {
		this.capsKey = process.env.CAPSOLVER_API_KEY;
		this.twoKey = process.env.TWOCAPTCHA_API_KEY;
	}

	public static isChallenge(status: number, body: any): boolean {
		if (status !== 400 || !body || typeof body !== 'object') return false;
		return Boolean(body.captcha_sitekey || body.captcha_service);
	}

	public static extractChallenge(body: any, url: string = 'https://discord.com'): CaptchaChallenge | null {
		if (!this.isChallenge(400, body)) return null;
		return {
			sitekey: String(body.captcha_sitekey),
			rqdata: body.captcha_rqdata ? String(body.captcha_rqdata) : undefined,
			service: String(body.captcha_service || 'hcaptcha'),
			url,
		};
	}

	public async solve(challenge: CaptchaChallenge): Promise<string | null> {
		if (this.capsKey) {
			return this.solveWithCapSolver(challenge);
		}
		if (this.twoKey) {
			return this.solveWith2Captcha(challenge);
		}
		return null; // Fallback to manual / skip
	}

	private async solveWithCapSolver(challenge: CaptchaChallenge): Promise<string | null> {
		try {
			const res = await fetch('https://api.capsolver.com/createTask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientKey: this.capsKey,
					task: {
						type: 'HCaptchaTaskProxyLess',
						websiteURL: challenge.url,
						websiteKey: challenge.sitekey,
						enterprisePayload: challenge.rqdata ? { rqdata: challenge.rqdata } : undefined,
					},
				}),
			});
			const data = (await res.json()) as any;
			if (data.errorId === 0 && data.taskId) {
				for (let i = 0; i < 30; i++) {
					await new Promise((r) => setTimeout(r, 2000));
					const resultRes = await fetch('https://api.capsolver.com/getTaskResult', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ clientKey: this.capsKey, taskId: data.taskId }),
					});
					const result = (await resultRes.json()) as any;
					if (result.status === 'ready') {
						return result.solution?.gRecaptchaResponse || null;
					}
					if (result.status === 'failed') break;
				}
			}
		} catch {
			// Failover
		}
		return null;
	}

	private async solveWith2Captcha(challenge: CaptchaChallenge): Promise<string | null> {
		try {
			const inRes = await fetch(
				`https://2captcha.com/in.php?key=${this.twoKey}&method=hcaptcha&sitekey=${challenge.sitekey}&pageurl=${encodeURIComponent(challenge.url)}&json=1${challenge.rqdata ? `&data=${encodeURIComponent(challenge.rqdata)}` : ''}`,
			);
			const inData = (await inRes.json()) as any;
			if (inData.status === 1 && inData.request) {
				const reqId = inData.request;
				for (let i = 0; i < 30; i++) {
					await new Promise((r) => setTimeout(r, 3000));
					const resRes = await fetch(
						`https://2captcha.com/res.php?key=${this.twoKey}&action=get&id=${reqId}&json=1`,
					);
					const resData = (await resRes.json()) as any;
					if (resData.status === 1) {
						return resData.request || null;
					}
					if (resData.request !== 'CAPCHA_NOT_READY') break;
				}
			}
		} catch {
			// Failover
		}
		return null;
	}
}

export const GlobalCaptchaPipeline = new CaptchaPipeline();
