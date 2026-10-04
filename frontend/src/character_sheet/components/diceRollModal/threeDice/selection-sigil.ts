import { BufferAttribute, Group, Mesh, MeshBasicMaterial, RingGeometry } from "three"

// A quiet, etched blood sigil on the page plane. Shared by selected dice; no pulse.
export const createSelectionSigil = () => {
    const sigil = new Group()
    const glow = new RingGeometry(0.94, 1.48, 64)
    const vertices = glow.getAttribute("position")
    const colors = new Float32Array(vertices.count * 4)
    for (let i = 0; i < vertices.count; i++) {
        colors.set([1, 1, 1, Math.hypot(vertices.getX(i), vertices.getY(i)) < 1 ? 1 : 0], i * 4)
    }
    glow.setAttribute("color", new BufferAttribute(colors, 4))
    sigil.add(
        new Mesh(
            glow,
            new MeshBasicMaterial({
                color: "#b72239",
                transparent: true,
                opacity: 0.26,
                vertexColors: true,
                depthWrite: false
            })
        )
    )
    const ink = new MeshBasicMaterial({
        color: "#e36976",
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    })
    for (let quadrant = 0; quadrant < 4; quadrant++) {
        const start = (quadrant * Math.PI) / 2 + 0.08
        sigil.add(new Mesh(new RingGeometry(1.1, 1.125, 24, 1, start, Math.PI / 2 - 0.16), ink))
        sigil.add(
            new Mesh(
                new RingGeometry(1.16, 1.3, 1, 1, (quadrant * Math.PI) / 2 - 0.012, 0.024),
                ink
            )
        )
    }
    sigil.rotation.x = -Math.PI / 2
    sigil.position.y = 0.018
    return sigil
}
