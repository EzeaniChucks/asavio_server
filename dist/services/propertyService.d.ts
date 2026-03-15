import { Property } from "../entities/Property";
export declare class PropertyService {
    private propertyRepository;
    private imageRepository;
    createProperty(propertyData: any, hostId: string, images?: any[]): Promise<Property>;
    getPropertyById(id: string): Promise<Property>;
    getMyProperties(hostId: string): Promise<Property[]>;
    getAllProperties(filters: any): Promise<Property[]>;
    getAvailablePropertyTypes(): Promise<string[]>;
    updateProperty(id: string, updateData: any, hostId: string): Promise<Property>;
    deleteProperty(id: string, hostId: string): Promise<void>;
}
//# sourceMappingURL=propertyService.d.ts.map