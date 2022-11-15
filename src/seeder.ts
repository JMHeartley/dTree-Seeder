import Member from "./member";

let dTreeSeeder = {
    _getWithParentIds: function (data: Member[], id: number | null): Member {
        const member = data.find((member) => member.id === id);

        if (member === undefined) {
            throw new Error(`Member with id (${id}) was not found`);
        }
        return member;
    },
    _getWithoutParentIds: function (data: Member[], id: number | null): Member {
        let member = this._getWithParentIds(data, id);

        member.parent1Id = null;
        member.parent2Id = null;
        return member;
    },
    _get: function (data: Member[], ids: number[], parentOptions: { preserveParentIds: boolean }): Member[] {
        const members = new Array<Member>();
        ids.forEach(id => {
            const member = (parentOptions.preserveParentIds)
                ? this._getWithParentIds(data, id)
                : this._getWithoutParentIds(data, id);
            members.push(member);
        });
        return members;
    },
    _getChildren: function (data: Member[], ...parents: Member[]): Member[] {
        const childIds = data.filter((member) =>
            parents.some((parent) => parent.id === member.parent1Id || parent.id === member.parent2Id))
            .map((member) => member.id);

        if (childIds.length === 0) {
            return [];
        }
        return this._get(data, childIds, { preserveParentIds: true });
    },
    _getOtherParents: function (data: Member[], children: Member[], ...parents: Member[]): Member[] {
        const parentIds = parents.map((parent) => parent.id);
        const otherParentIds = children.map((child) =>
            parentIds.includes(child.parent1Id as number)
                ? child.parent2Id
                : child.parent1Id);

        // remove duplicates when siblings have common parent
        const uniqueOtherParentIds = otherParentIds.filter((value, index) =>
            index === otherParentIds.indexOf(value));

        // remove parentIds so their ancestors aren't included
        return this._get(data, uniqueOtherParentIds as number[], { preserveParentIds: false });
    },
    _getRelatives: function (data: Member[], targetId?: number): Member[] {
        if (targetId === undefined) {
            return [];
        }

        const members = new Array<Member>();

        const target = this._getWithParentIds(data, targetId);
        members.push(target);

        const hasParent1 = target.parent1Id !== null;
        const hasParent2 = target.parent2Id !== null;
        if (hasParent1) {
            // remove parentIds so their ancestors aren't included
            const parent1 = this._getWithoutParentIds(data, target.parent1Id);
            members.push(parent1);
        }
        if (hasParent2) {
            // remove parentIds so their ancestors aren't included
            const parent2 = this._getWithoutParentIds(data, target.parent2Id);
            members.push(parent2);
        }

        if (hasParent1 || hasParent2) {
            const siblingIds = data.filter((member) =>
                ((member.parent1Id === target.parent1Id || member.parent2Id === target.parent2Id)
                    || (member.parent1Id === target.parent2Id || member.parent2Id === target.parent1Id))
                && member.id !== target.id)
                .map((member) => member.id);
            const siblings = this._get(data, siblingIds, { preserveParentIds: true });
            members.push(...siblings);
        }

        const children = this._getChildren(data, target);
        members.push(...children);

        if (children.length === 0) {
            return members;
        }

        const otherParents = this._getOtherParents(data, children, target);
        members.push(...otherParents);

        let nextGeneration = children;
        do {
            const nextGenerationChildren = this._getChildren(data, ...nextGeneration);
            members.push(...nextGenerationChildren);

            const nextGenerationOtherParents = this._getOtherParents(data, nextGenerationChildren, ...nextGeneration);
            members.push(...nextGenerationOtherParents);

            nextGeneration = nextGenerationChildren;
        } while (nextGeneration.length > 0);

        return members;
    seed: function (data: Member[], targetId?: number): Member[] {
        return this._getRelatives(data, targetId);
    }
};

//3. generate tree hierarchy
//4. return in json format
//5. add options object to specify which relatives to include

export default dTreeSeeder;