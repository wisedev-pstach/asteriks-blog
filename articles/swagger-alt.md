![API Documentation](https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)

# API Documentation Alternatives in .NET 9

**Author:** WiseDev  
**Date:** August 4, 2025  
**Tags:** dotnet, api, documentation, webapi, tools  

Discovering that Swagger UI is no longer included by default in .NET 9 is like showing up to a party and finding out the DJ went home. The music stopped, but the party doesn't have to end.

In this guide, I'll show you the best alternatives to Swagger UI that will make your API documentation shine brighter than before.

---

## The Swagger Situation in .NET 9

You upgrade to .NET 9, run `dotnet new webapi`, navigate to `/swagger`, and... nothing. Just a cold 404 staring back at you.

Don't panic. Microsoft removed Swagger UI from the default template, and honestly, it's time for something better. The web has evolved, and so have our documentation tools.

## What We'll Cover

By the end of this article, you'll have:

1. A simple .NET 9 API setup
2. Three modern documentation alternatives
3. The knowledge to pick the right tool for your project

All code is available in [this repository](https://github.com/wisedev-pstach/dotnet9-api-docs-alternatives).

## Setting Up a Basic .NET 9 API

Let's create a minimal API to demonstrate the documentation tools:

```bash
dotnet new webapi -n ApiDocsDemo
cd ApiDocsDemo
```

Replace the contents of `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Sample data
var products = new List<Product>
{
    new(1, "Laptop", 999.99m),
    new(2, "Mouse", 29.99m),
    new(3, "Keyboard", 79.99m)
};

// API endpoints
app.MapGet("/products", () => products)
   .WithName("GetProducts")
   .WithSummary("Get all products");

app.MapGet("/products/{id}", (int id) => 
    products.FirstOrDefault(p => p.Id == id) is Product product
        ? Results.Ok(product)
        : Results.NotFound())
   .WithName("GetProduct")
   .WithSummary("Get product by ID");

app.MapPost("/products", (Product product) =>
{
    products.Add(product);
    return Results.Created($"/products/{product.Id}", product);
})
   .WithName("CreateProduct")
   .WithSummary("Create a new product");

app.Run();

public record Product(int Id, string Name, decimal Price);
```

Now let's explore the documentation alternatives.

## Alternative 1: Scalar - The Modern Choice

Scalar is like Swagger UI's younger, cooler sibling who studied modern design.

### Installation

```bash
dotnet add package Scalar.AspNetCore
```

Update `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); // .NET 9 way

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Instead of UseSwaggerUI()
}

// ... your endpoints here

app.Run();
```

Visit `/scalar/v1` and prepare to be impressed.

### Customization

```csharp
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("My API Documentation")
        .WithTheme(ScalarTheme.Purple)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});
```

**Pros:** Fast, beautiful, modern UX  
**Cons:** Newer ecosystem, fewer customization options

## Alternative 2: RapiDoc - The Lightweight Option

RapiDoc is compact and efficient - perfect for simpler APIs.

### Setup

Add to `wwwroot/rapidoc.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body>
    <rapi-doc 
        spec-url="/openapi/v1.json"
        theme="dark"
        render-style="read"
        layout="row"
        allow-try="true">
    </rapi-doc>
</body>
</html>
```

Enable static files in `Program.cs`:

```csharp
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseStaticFiles();
}

app.MapGet("/docs", () => Results.Redirect("/rapidoc.html"));
```

**Pros:** Lightweight, mobile-friendly, web component  
**Cons:** More setup required, less polished

## Alternative 3: Classic Swagger UI - The Reliable Veteran

After exploring the new kids on the block, let's give credit where it's due. Swagger UI has been serving developers faithfully for years and remains an excellent choice.

### Bringing Back Swagger UI

```bash
dotnet add package Swashbuckle.AspNetCore
```

Update `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(); // For Swagger UI support

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ... your endpoints here

app.Run();
```

Visit `/swagger` for the familiar interface we all know and love.

### Why Swagger UI Still Rocks

```csharp
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    options.DocumentTitle = "My API Documentation";
    options.DefaultModelsExpandDepth(-1); // Hide schemas by default
    options.EnableTryItOutByDefault();
});
```

**Pros:** Battle-tested, huge ecosystem, extensive customization, universal recognition  
**Cons:** Older UI design, can feel dated compared to modern alternatives

## Which One Should You Choose?

- **Scalar**: Modern APIs that need to impress
- **RapiDoc**: Simple APIs where performance matters
- **Swagger UI**: The reliable choice that never goes out of style

## Conclusion

The removal of Swagger UI from .NET 9 templates isn't a step back - it's an opportunity to upgrade to better tools. Whether you choose Scalar's modern interface, RapiDoc's efficiency, or stick with Swagger UI's reliability, your API documentation can be better than ever.

Pick the tool that fits your needs, not just the default. Your developers (and your future self) will thank you.

What documentation tool are you planning to try first? Have you found any other great alternatives? Share your thoughts!