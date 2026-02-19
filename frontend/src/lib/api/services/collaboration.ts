import { BaseAPI } from '../core';

export class CollaborationService extends BaseAPI {
    getAnnotations(bbox: string | null = null, type: string | null = null, status: string | null = null, page = 1) {
        let url = `/api/collaboration/annotations?page=${page}`;
        if (bbox) url += `&bbox=${bbox}`;
        if (type) url += `&annotation_type=${type}`;
        if (status) url += `&status=${status}`;
        return this.get(url);
    }

    createAnnotation(annotation: unknown) {
        return this.post('/api/collaboration/annotations', annotation);
    }

    updateAnnotation(id: string | number, update: unknown) {
        return this.patch(`/api/collaboration/annotations/${id}`, update);
    }

    deleteAnnotation(id: string | number) {
        return this.delete(`/api/collaboration/annotations/${id}`);
    }

    getAnnotationReplies(annotationId: string | number) {
        return this.get(`/api/collaboration/annotations/${annotationId}/replies`);
    }

    createReply(annotationId: string | number, reply: unknown) {
        return this.post(`/api/collaboration/annotations/${annotationId}/replies`, reply);
    }

    getMarkers(bbox: string | null = null) {
        let url = '/api/collaboration/markers';
        if (bbox) url += `?bbox=${bbox}`;
        return this.get(url);
    }

    createMarker(marker: unknown) {
        return this.post('/api/collaboration/markers', marker);
    }
}
