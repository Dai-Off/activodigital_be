import { ApifyClient } from "apify-client";
import {
  ScrapeIdealistaRequest,
  IdealistaProperty,
  ApifyRunResponse,
  IgolaizolaLocation,
} from "../../types/idealistaScraper";
import locationsData from "../IdealistaIdLocations/ubicaciones.json";

export class ApifyService {
  private apifyToken = process.env.APIFY_TOKEN;
  private actorId = "REcGj6dyoIJ9Z7aE6";
  private locations: IgolaizolaLocation[] =
    locationsData as IgolaizolaLocation[];

  private getApifyClient() {
    return new ApifyClient({ token: this.apifyToken });
  }

  private findLocationId(name: string): string {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const term = normalize(name);

    const found = this.locations.find((loc) => normalize(loc.name) === term);

    if (!found) {
      throw new Error(
        `La ubicación '${name}' no existe en el catálogo oficial.`
      );
    }

    return found.id;
  }

  private calculateAverage(items: IdealistaProperty[]): number {
    const prices = items.filter((i) => i.price > 0).map((i) => i.price);
    return prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;
  }

  private calculateAverageSqm(items: IdealistaProperty[]): number {
    const validItems = items.filter(
      (item) => item.price > 0 && item.area && item.area > 0
    );

    if (validItems.length === 0) return 0;

    const sumSqmPrices = validItems.reduce((acc, item) => {
      return acc + item.price / item.area!;
    }, 0);

    return Math.round(sumSqmPrices / validItems.length);
  }

  async scrapeIdealistaProperties(
    data: ScrapeIdealistaRequest
  ): Promise<ApifyRunResponse> {
    const client = this.getApifyClient();

    if (!data.locationName) {
      throw new Error("El campo 'locationName' es obligatorio.");
    }

    const locationId = this.findLocationId(data.locationName);

    const actorInput = {
      location: locationId,
      maxItems: data.maxItems || 20,
    };

    try {
      const run = await client.actor(this.actorId).call(actorInput);
      if (!run) throw new Error("Fallo en la ejecución del Actor.");

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      const mappedItems = items.map((item: any) => this.mapToProperty(item));

      return {
        totalItems: mappedItems.length,
        items: mappedItems,
        averagePrice: this.calculateAverage(mappedItems),
        averagePricePerSqm: this.calculateAverageSqm(mappedItems),
      };
    } catch (error: any) {
      throw new Error(`Apify Error: ${error.message}`);
    }
  }

  private mapToProperty(data: any): IdealistaProperty {
    return {
      url: data.url,
      title: data.title || data.elementTitle,
      price: data.price || 0,
      currency: data.currency || "EUR",
      thumbnail: data.thumbnail || data.image,
      location: data.address || data.location,
      rooms: data.rooms,
      area: data.size || data.area,
    };
  }
}
